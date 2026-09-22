import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AUTH_RATE_LIMIT_MESSAGE, getClientIp, isAuthRateLimited } from '@/lib/auth-rate-limit'

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase no está configurado para crear cuentas.')
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function getRegistrationMessage(error: { code?: string; message?: string }) {
  switch (error.code) {
    case 'email_exists':
    case 'user_already_exists':
      return 'Este correo ya tiene una cuenta. Inicia sesión o usa otro correo.'
    case 'email_address_invalid':
      return 'Ingresa un correo electrónico válido.'
    case 'weak_password':
      return 'La contraseña es demasiado débil. Usa al menos 6 caracteres.'
    case 'over_email_send_rate_limit':
      return 'Se alcanzó el límite de intentos. Espera unos minutos e inténtalo nuevamente.'
    default:
      return 'No pudimos crear la cuenta. Revisa el nombre, correo y contraseña e inténtalo nuevamente.'
  }
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request)

  if (isAuthRateLimited(clientIp)) {
    return NextResponse.json(
      { ok: false, message: AUTH_RATE_LIMIT_MESSAGE },
      { status: 429 },
    )
  }

  try {
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!name || name.length > 80 || !email || !password || password.length < 6 || password.length > 128) {
      return NextResponse.json({ ok: false, message: 'Revisa los datos ingresados.' }, { status: 400 })
    }

    const { data, error } = await getSupabaseAdmin().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: name },
    })

    if (error || !data.user) {
      console.error('[v0] Supabase registration error:', error?.code ?? error?.message ?? 'missing user')
      return NextResponse.json(
        { ok: false, message: error ? getRegistrationMessage(error) : 'Supabase no devolvió una cuenta creada. Inténtalo nuevamente.' },
        { status: error?.code === 'email_exists' || error?.code === 'user_already_exists' ? 409 : 400 },
      )
    }

    return NextResponse.json({ ok: true, email })
  } catch (error) {
    console.error('[v0] Registration request failed:', error instanceof Error ? error.message : 'unknown error')
    const message = error instanceof Error && error.message.includes('no está configurado')
      ? 'La creación de cuentas no está configurada todavía. Contacta al administrador.'
      : 'No pudimos crear la cuenta por un problema temporal. Inténtalo nuevamente.'
    return NextResponse.json({ ok: false, message }, { status: 500 })
  }
}
