import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

export const RECOVERY_GRANT_COOKIE = 'cuentaclarita-recovery-grant'
export const RECOVERY_GRANT_TTL_SECONDS = 10 * 60

export type RecoveryGrant = {
  userId: string
  sessionId: string
  expiresAt: number
}

type RecoveryClaims = {
  sub?: unknown
  session_id?: unknown
}

type RecoveryGrantPayload = RecoveryGrant

function getSigningKey() {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret) throw new Error('Supabase signing secret is not configured.')

  return createHmac('sha256', secret)
    .update('cuentaclarita:password-recovery-grant:v1')
    .digest()
}

function signPayload(payload: string) {
  return createHmac('sha256', getSigningKey()).update(payload).digest('base64url')
}

export function createRecoveryGrant(userId: string, sessionId: string, now = Date.now()) {
  const grant: RecoveryGrantPayload = {
    userId,
    sessionId,
    expiresAt: Math.floor(now / 1000 + RECOVERY_GRANT_TTL_SECONDS) * 1000,
  }
  const payload = Buffer.from(JSON.stringify(grant)).toString('base64url')

  return `${payload}.${signPayload(payload)}`
}

export function verifyRecoveryGrant(
  value: string | undefined,
  claims: RecoveryClaims | undefined,
  now = Date.now(),
): RecoveryGrant | null {
  if (!value || !claims) return null

  const parts = value.split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null

  const [payload, suppliedSignature] = parts
  const expectedSignature = Buffer.from(signPayload(payload), 'base64url')
  const actualSignature = Buffer.from(suppliedSignature, 'base64url')
  if (actualSignature.length !== expectedSignature.length) return null
  if (!timingSafeEqual(actualSignature, expectedSignature)) return null

  try {
    const grant = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<RecoveryGrantPayload>
    const nowSeconds = Math.floor(now / 1000)
    const expiresAtSeconds = typeof grant.expiresAt === 'number' ? Math.floor(grant.expiresAt / 1000) : 0

    if (
      typeof grant.userId !== 'string' ||
      typeof grant.sessionId !== 'string' ||
      !Number.isSafeInteger(grant.expiresAt) ||
      !grant.userId ||
      !grant.sessionId ||
      expiresAtSeconds <= nowSeconds ||
      expiresAtSeconds > nowSeconds + RECOVERY_GRANT_TTL_SECONDS ||
      grant.userId !== claims.sub ||
      grant.sessionId !== claims.session_id
    ) {
      return null
    }

    return {
      userId: grant.userId,
      sessionId: grant.sessionId,
      expiresAt: expiresAtSeconds * 1000,
    }
  } catch {
    return null
  }
}

export function getRecoveryGrantCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: RECOVERY_GRANT_TTL_SECONDS,
  }
}

export async function getRecoveryGrantForCurrentSession(supabase: SupabaseClient) {
  const cookieStore = await cookies()
  const value = cookieStore.get(RECOVERY_GRANT_COOKIE)?.value
  if (!value) return null

  try {
    const { data, error } = await supabase.auth.getClaims()
    if (error || !data?.claims) return null
    return verifyRecoveryGrant(value, data.claims as RecoveryClaims)
  } catch {
    return null
  }
}
