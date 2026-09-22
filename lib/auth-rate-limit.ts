const AUTH_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const AUTH_RATE_LIMIT_MAX_ATTEMPTS = 5
const authAttempts = new Map<string, number[]>()

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const connectingIp = request.headers.get('cf-connecting-ip')

  return forwardedFor?.split(',')[0]?.trim() || realIp || connectingIp || 'unknown'
}

export function isAuthRateLimited(ip: string) {
  const now = Date.now()
  const recentAttempts = (authAttempts.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < AUTH_RATE_LIMIT_WINDOW_MS,
  )

  if (recentAttempts.length >= AUTH_RATE_LIMIT_MAX_ATTEMPTS) {
    authAttempts.set(ip, recentAttempts)
    return true
  }

  recentAttempts.push(now)
  authAttempts.set(ip, recentAttempts)
  return false
}

export const AUTH_RATE_LIMIT_MESSAGE = 'Demasiados intentos, espera unos minutos e inténtalo nuevamente.'
