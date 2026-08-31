'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'

type LocalUser = { id: string; name: string; email: string; password: string }
type SessionUser = Omit<LocalUser, 'password'>

type AuthContextValue = {
  user: SessionUser | null
  loaded: boolean
  signIn: (email: string, password: string) => { ok: boolean; message?: string }
  signUp: (name: string, email: string, password: string) => { ok: boolean; message?: string }
  signOut: () => void
}

const USERS_KEY = 'cuentaclarita:users:v1'
const SESSION_KEY = 'cuentaclarita:session:v1'
const AuthContext = React.createContext<AuthContextValue | null>(null)

function read<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = React.useState<SessionUser | null>(null)
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    setUser(read<SessionUser | null>(SESSION_KEY, null))
    setLoaded(true)
  }, [])

  React.useEffect(() => {
    if (!loaded) return
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/registro')
    if (!user && !isAuthRoute) router.replace('/login')
    if (user && isAuthRoute) router.replace('/')
  }, [loaded, pathname, router, user])

  const signIn = React.useCallback((email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    const found = read<LocalUser[]>(USERS_KEY, []).find(
      (candidate) => candidate.email === normalizedEmail && candidate.password === password,
    )
    if (!found) return { ok: false, message: 'Correo o contraseña incorrectos.' }
    const session = { id: found.id, name: found.name, email: found.email }
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(session)
    router.replace('/')
    return { ok: true }
  }, [router])

  const signUp = React.useCallback((name: string, email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    const users = read<LocalUser[]>(USERS_KEY, [])
    if (users.some((candidate) => candidate.email === normalizedEmail)) {
      return { ok: false, message: 'Ya existe una cuenta con ese correo.' }
    }
    const newUser: LocalUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      password,
    }
    users.push(newUser)
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
    const session = { id: newUser.id, name: newUser.name, email: newUser.email }
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(session)
    router.replace('/')
    return { ok: true }
  }, [router])

  const signOut = React.useCallback(() => {
    window.localStorage.removeItem(SESSION_KEY)
    setUser(null)
    router.replace('/login')
  }, [router])

  return <AuthContext.Provider value={{ user, loaded, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}

export const AUTH_STORAGE_KEYS = { USERS_KEY, SESSION_KEY }
// Sustituir este provider por Supabase Auth cuando se conecte la integración.
