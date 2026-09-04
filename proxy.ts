import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  const response = await updateSession(request)
  const pathname = request.nextUrl.pathname
  const protectedRoute = pathname === '/' || pathname.startsWith('/meses') || pathname.startsWith('/historial')
  const hasSession = Boolean(response.cookies.getAll().some((cookie) => cookie.name.includes('auth-token')))
  if (protectedRoute && !hasSession) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return Response.redirect(loginUrl)
  }
  return response
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'] }
