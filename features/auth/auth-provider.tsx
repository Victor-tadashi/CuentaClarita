'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { type AuthChangeEvent, type Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { IdleSessionGuard } from './idle-session-guard'

type SessionUser = { id: string; name: string; email: string }
type AuthContextValue = { user: SessionUser | null; loaded: boolean; recoveryAuthorized: boolean; signIn: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>; signUp: (name: string, email: string, password: string) => Promise<{ ok: boolean; message?: string }>; signOut: () => Promise<void> }
const AuthContext = React.createContext<AuthContextValue | null>(null)

function mapUser(user: { id: string; email?: string; user_metadata?: { display_name?: string } }): SessionUser {
  return { id: user.id, email: user.email ?? '', name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuario' }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter(); const pathname = usePathname()
  const supabase = React.useMemo(() => typeof window === 'undefined' ? null : createClient(), [])
  const [user, setUser] = React.useState<SessionUser | null>(null); const [loaded, setLoaded] = React.useState(false)
  const [recoveryUserId, setRecoveryUserId] = React.useState<string | null>(null)
  const recoveryUserIdRef = React.useRef<string | null>(null)
  const invalidSessionHandled = React.useRef(false)

  React.useEffect(() => {
    if (!supabase) return

    const isInvalidRefreshToken = (error: unknown) => {
      const value = error as { code?: string; message?: string } | null
      return value?.code === 'refresh_token_not_found' || value?.message?.toLowerCase().includes('refresh token not found') === true
    }

    const clearLocalSupabaseStorage = () => {
      if (typeof window === 'undefined') return
      for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
        const key = window.localStorage.key(index)
        if (key?.startsWith('sb-')) window.localStorage.removeItem(key)
      }
    }

    const clearRecoveryAuthorization = () => {
      recoveryUserIdRef.current = null
      setRecoveryUserId(null)
    }

    const handleInvalidSession = () => {
      if (invalidSessionHandled.current) return
      invalidSessionHandled.current = true
      setUser(null)
      clearRecoveryAuthorization()
      clearLocalSupabaseStorage()
      void supabase.auth.signOut({ scope: 'local' }).catch(() => undefined)
    }

    const { data } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'TOKEN_REFRESHED' && !session) {
        handleInvalidSession()
        return
      }

      if (event === 'PASSWORD_RECOVERY' && session?.user) {
        recoveryUserIdRef.current = session.user.id
        setRecoveryUserId(session.user.id)
      } else if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || !session) {
        recoveryUserIdRef.current = null
        setRecoveryUserId(null)
      }

      setUser(session?.user ? mapUser(session.user) : null)
    })

    supabase.auth.getSession().then(({ data: sessionData, error }: { data: { session: Session | null }; error: { code?: string; message?: string } | null }) => {
      if (isInvalidRefreshToken(error)) handleInvalidSession()
      else setUser(sessionData.session?.user ? mapUser(sessionData.session.user) : null)
      setLoaded(true)
    }).catch((error: unknown) => {
      if (isInvalidRefreshToken(error)) handleInvalidSession()
      else setUser(null)
      setLoaded(true)
    })

    return () => data.subscription.unsubscribe()
  }, [supabase])
  React.useEffect(() => {
    if (!loaded) return
    const recoveryRoute = pathname === '/recuperar-contrasena' || pathname.startsWith('/recuperar-contrasena/')
    const publicRoute = pathname.startsWith('/login') || pathname.startsWith('/registro') || recoveryRoute
    const loginRoute = pathname.startsWith('/login')
    if (!user && !publicRoute) router.replace('/login')
    if (user && loginRoute) router.replace('/')
  }, [loaded, pathname, router, user])
  const value = React.useMemo<AuthContextValue>(() => ({
    user,
    loaded,
    recoveryAuthorized: Boolean(user && recoveryUserId === user.id),
    async signIn(email, password) {
      if (!supabase) return { ok: false, message: 'El servicio de autenticación no está disponible.' }
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.ok || !result.session) {
          return { ok: false, message: result?.message ?? 'Correo o contraseña incorrectos.' }
        }
        const { error } = await supabase.auth.setSession(result.session)
        if (error) return { ok: false, message: 'No pudimos iniciar sesión. Inténtalo nuevamente.' }
        router.replace('/')
        return { ok: true }
      } catch {
        return { ok: false, message: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.' }
      }
    },
    async signUp(name, email, password) {
      try {
        const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) })
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.ok) return { ok: false, message: result?.message ?? 'No pudimos crear la cuenta. Revisa tus datos e inténtalo nuevamente.' }
      } catch {
        return { ok: false, message: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.' }
      }
      return { ok: true, message: 'Cuenta creada correctamente. Ahora inicia sesión con tu correo y contraseña.' }
    },
    async signOut() {
      try {
        if (supabase) {
          const { error } = await supabase.auth.signOut({ scope: 'local' })
          if (error) setUser(null)
        }
      } catch {
        setUser(null)
      } finally {
        recoveryUserIdRef.current = null
        setRecoveryUserId(null)
        setUser(null)
        router.replace('/login')
      }
    },
  }), [loaded, recoveryUserId, router, supabase, user])
  return (
    <AuthContext.Provider value={value}>
      {children}
      <IdleSessionGuard
        enabled={loaded && Boolean(user) && !pathname.startsWith('/login') && !pathname.startsWith('/registro') && pathname !== '/recuperar-contrasena' && !pathname.startsWith('/recuperar-contrasena/')}
        userId={user?.id ?? null}
        onSignOut={value.signOut}
      />
    </AuthContext.Provider>
  )
}
export function useAuth() { const context = React.useContext(AuthContext); if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider'); return context }
