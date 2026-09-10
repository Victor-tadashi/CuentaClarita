'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { LogIn, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/auth-provider'

export default function LoginPage() {
  const { signIn, signUp, user, loaded } = useAuth()
  const router = useRouter()
  const [registering, setRegistering] = React.useState(false)
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')

  if (!loaded || user) return null

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (registering && name.trim().length < 2) {
      setError('Escribe tu nombre para continuar.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    const result = registering ? await signUp(name, email, password) : await signIn(email, password)
    if (!result.ok) {
      setError(result.message ?? 'No pudimos completar la acción.')
      return
    }
    if (registering) {
      setSuccess(result.message ?? 'Cuenta creada correctamente. Bienvenido a CuentaClarita.')
      window.setTimeout(() => router.replace('/'), 1200)
    }
  }

  return (
    <main className="login-page flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="login-orb login-orb-left" aria-hidden="true" />
      <div className="login-orb login-orb-right" aria-hidden="true" />
      <section className="login-content w-full max-w-3xl">
        <div className="mb-8 flex flex-col items-center text-center sm:mb-10">
          <div className="login-brand-frame">
            <Image
              src="/brand/cuenta-clarita.png"
              alt="CuentaClarita — tus finanzas, siempre claras"
              width={560}
              height={240}
              className="login-brand-image"
              priority
            />
          </div>
          <h1 className="sr-only">CuentaClarita</h1>
          <p className="mt-7 text-lg text-muted-foreground sm:text-xl">
            {registering ? 'Crea tu cuenta para ordenar tus finanzas.' : 'Tus finanzas claras, mes a mes.'}
          </p>
        </div>

        <div className="login-card rounded-2xl p-6 sm:p-12">
          <div className="mb-8 flex items-center gap-4">
            <span className="login-icon flex size-16 shrink-0 items-center justify-center rounded-2xl">
              {registering ? <UserPlus className="size-8" /> : <LogIn className="size-8" />}
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{registering ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
              <p className="mt-1 text-base text-muted-foreground sm:text-lg">Acceso seguro con Supabase.</p>
            </div>
          </div>

          <form className="flex flex-col gap-5" onSubmit={submit}>
            {registering && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" autoComplete="name" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label className="text-base" htmlFor="email">Correo electrónico</Label>
              <Input className="login-input h-16 rounded-xl px-5 text-lg" id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" autoComplete="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-base" htmlFor="password">Contraseña</Label>
              <Input className="login-input h-16 rounded-xl px-5 text-lg" id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 6 caracteres" autoComplete={registering ? 'new-password' : 'current-password'} required />
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            {success && <p className="text-sm text-primary" role="status">{success}</p>}
            <Button type="submit" size="lg" className="login-submit mt-3 h-16 w-full rounded-xl text-lg font-semibold" disabled={Boolean(success)}>
              {registering ? 'Crear cuenta' : 'Entrar a mi dashboard'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {registering ? '¿Ya tienes una cuenta?' : '¿Todavía no tienes una cuenta?'}{' '}
            <button type="button" className="font-medium text-primary hover:underline" onClick={() => { setRegistering((value) => !value); setError('') }}>
              {registering ? 'Inicia sesión' : 'Crear cuenta'}
            </button>
          </p>
        </div>
        <p className="login-security-note mt-8 text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
          Tu acceso está protegido y listo para sincronizar tus finanzas.
        </p>
        <Link href="/" className="sr-only">Ir al dashboard</Link>
      </section>
    </main>
  )
}
