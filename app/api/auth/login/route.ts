import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AUTH_RATE_LIMIT_MESSAGE, getClientIp, isAuthRateLimited } from '@/lib/auth-rate-limit'

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
}

function getSupabasePublishableKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?? process.env.SUPABASE_ANON_KEY
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
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const url = getSupabaseUrl()
    const publishableKey = getSupabasePublishableKey()

    if (!email || !password) {
      return NextResponse.json({ ok: false, message: 'Revisa los datos ingresados.' }, { status: 400 })
    }

    if (!url || !publishableKey) {
      return NextResponse.json({ ok: false, message: 'El servicio de autenticación no está disponible.' }, { status: 500 })
    }

    const supabase = createClient(url, publishableKey)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.session) {
      return NextResponse.json({ ok: false, message: 'Correo o contraseña incorrectos.' }, { status: 401 })
    }

    return NextResponse.json({ ok: true, session: data.session })
  } catch {
    return NextResponse.json({ ok: false, message: 'No pudimos iniciar sesión por un problema temporal.' }, { status: 500 })
  }
}
