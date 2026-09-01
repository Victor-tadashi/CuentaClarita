'use client'

'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type SessionUser = { id: string; name: string; email: string }
type AuthContextValue = { user: SessionUser | null; loaded: boolean; signIn: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>; signUp: (name: string, email: string, password: string) => Promise<{ ok: boolean; message?: string }>; signOut: () => Promise<void> }
const AuthContext = React.createContext<AuthContextValue | null>(null)

function mapUser(user: { id: string; email?: string; user_metadata?: { display_name?: string } }): SessionUser {
  return { id: user.id, email: user.email ?? '', name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuario' }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter(); const pathname = usePathname(); const supabase = React.useMemo(() => createClient(), [])
  const [user, setUser] = React.useState<SessionUser | null>(null); const [loaded, setLoaded] = React.useState(false)
  React.useEffect(() => { supabase.auth.getUser().then(({ data }: { data: { user: Parameters<typeof mapUser>[0] | null } }) => { setUser(data.user ? mapUser(data.user) : null); setLoaded(true) }); const { data } = supabase.auth.onAuthStateChange((_event: string, session: { user: Parameters<typeof mapUser>[0] | null } | null) => setUser(session?.user ? mapUser(session.user) : null)); return () => data.subscription.unsubscribe() }, [supabase])
  React.useEffect(() => { if (!loaded) return; const authRoute = pathname.startsWith('/login'); if (!user && !authRoute) router.replace('/login'); if (user && authRoute) router.replace('/') }, [loaded, pathname, router, user])
  const value = React.useMemo<AuthContextValue>(() => ({ user, loaded,
    async signIn(email, password) { const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password }); if (error) return { ok: false, message: 'Correo o contraseña incorrectos.' }; router.replace('/'); return { ok: true } },
    async signUp(name, email, password) { const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) }); const result = await response.json().catch(() => null); if (!response.ok || !result?.ok) return { ok: false, message: result?.message ?? 'No pudimos crear la cuenta. Revisa tus datos e inténtalo nuevamente.' }; const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password }); if (error) return { ok: false, message: 'La cuenta fue creada, pero no pudimos iniciar la sesión. Inténtalo nuevamente.' }; router.replace('/'); return { ok: true } },
    async signOut() { await supabase.auth.signOut(); router.replace('/login') },
  }), [loaded, router, supabase, user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth() { const context = React.useContext(AuthContext); if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider'); return context }
