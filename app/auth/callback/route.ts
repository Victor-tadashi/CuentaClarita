import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const RECOVERY_PASSWORD_PATH = '/recuperar-contrasena/nueva'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (url.searchParams.get('next') === RECOVERY_PASSWORD_PATH) {
    const recoveryUrl = new URL(RECOVERY_PASSWORD_PATH, url.origin)
    if (code) recoveryUrl.searchParams.set('code', code)
    if (url.searchParams.get('type') === 'recovery') recoveryUrl.searchParams.set('type', 'recovery')
    return NextResponse.redirect(recoveryUrl)
  }

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(new URL('/', request.url))
}
