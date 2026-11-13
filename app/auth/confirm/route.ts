import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createRecoveryGrant,
  getRecoveryGrantCookieOptions,
  RECOVERY_GRANT_COOKIE,
} from '@/lib/supabase/recovery-grant'

const RECOVERY_PASSWORD_PATH = '/recuperar-contrasena/nueva'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  cookieStore.delete(RECOVERY_GRANT_COOKIE)

  const tokenHashes = request.nextUrl.searchParams.getAll('token_hash')
  const types = request.nextUrl.searchParams.getAll('type')
  const tokenHash = tokenHashes[0]
  let grantValue: string | null = null
  let verifiedRecoverySession = false
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null

  if (
    tokenHashes.length === 1 &&
    types.length === 1 &&
    types[0] === 'recovery' &&
    tokenHash &&
    tokenHash.length <= 4096 &&
    tokenHash.trim() === tokenHash
  ) {
    try {
      supabase = await createClient()
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery',
      })

      if (!error && data.session) {
        verifiedRecoverySession = true
        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(data.session.access_token)
        const claims = claimsData?.claims as { sub?: unknown; session_id?: unknown } | undefined

        if (
          !claimsError &&
          typeof claims?.sub === 'string' &&
          typeof claims.session_id === 'string' &&
          claims.sub === data.session.user.id
        ) {
          grantValue = createRecoveryGrant(claims.sub, claims.session_id)
        }
      }
    } catch {
      grantValue = null
    }
  }

  if (!grantValue) {
    if (verifiedRecoverySession && supabase) {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined)
    }
    cookieStore.delete(RECOVERY_GRANT_COOKIE)
    return redirect(RECOVERY_PASSWORD_PATH)
  }

  cookieStore.set(RECOVERY_GRANT_COOKIE, grantValue, getRecoveryGrantCookieOptions())
  return redirect(RECOVERY_PASSWORD_PATH)
}
