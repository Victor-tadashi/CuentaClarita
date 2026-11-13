import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getRecoveryGrantCookieOptions,
  getRecoveryGrantForCurrentSession,
  RECOVERY_GRANT_COOKIE,
} from '@/lib/supabase/recovery-grant'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

function clearRecoveryGrant(response: NextResponse) {
  response.cookies.set(RECOVERY_GRANT_COOKIE, '', {
    ...getRecoveryGrantCookieOptions(),
    maxAge: 0,
  })
  return response
}

function jsonError(code: string, status: number) {
  return NextResponse.json({ ok: false, code }, { status, headers: NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) {
    return jsonError('invalid_request', 403)
  }

  const body = await request.json().catch(() => null) as unknown
  const password =
    body && typeof body === 'object' && !Array.isArray(body) && 'password' in body && typeof body.password === 'string'
      ? body.password
      : ''

  if (!password || password.length > 1024) {
    return jsonError('invalid_password', 400)
  }

  try {
    const supabase = await createClient()
    const recoveryGrant = await getRecoveryGrantForCurrentSession(supabase)
    if (!recoveryGrant) {
      return clearRecoveryGrant(jsonError('invalid_recovery', 401))
    }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      if (error.code === 'weak_password') return jsonError('weak_password', 400)
      if (error.status === 429) return jsonError('rate_limit', 429)
      return jsonError('update_failed', 400)
    }

    return clearRecoveryGrant(
      NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS }),
    )
  } catch {
    return jsonError('update_failed', 500)
  }
}

export async function DELETE() {
  return clearRecoveryGrant(
    new NextResponse(null, { status: 204, headers: NO_STORE_HEADERS }),
  )
}
