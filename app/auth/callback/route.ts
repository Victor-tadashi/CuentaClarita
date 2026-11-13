import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const RECOVERY_PASSWORD_PATH = '/recuperar-contrasena/nueva'
const RECOVERY_CONFIRM_PATH = '/auth/confirm'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const type = url.searchParams.get('type')
  const tokenHashes = url.searchParams.getAll('token_hash')
  const next = url.searchParams.get('next')
  const isRecoveryCallback =
    type === 'recovery' || next === RECOVERY_CONFIRM_PATH || next === RECOVERY_PASSWORD_PATH

  if (isRecoveryCallback) {
    const confirmUrl = new URL(RECOVERY_CONFIRM_PATH, url.origin)
    if (type === 'recovery' && tokenHashes.length === 1 && tokenHashes[0]) {
      confirmUrl.searchParams.set('token_hash', tokenHashes[0])
      confirmUrl.searchParams.set('type', 'recovery')
    }
    return NextResponse.redirect(confirmUrl)
  }

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(new URL('/', request.url))
}
