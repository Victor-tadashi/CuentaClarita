import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function POST(request: Request) {
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
      return NextResponse.json({ ok: false, message: 'No pudimos crear la cuenta. Revisa tus datos e inténtalo nuevamente.' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, email })
  } catch {
    return NextResponse.json({ ok: false, message: 'No pudimos crear la cuenta. Inténtalo nuevamente.' }, { status: 500 })
  }
}
