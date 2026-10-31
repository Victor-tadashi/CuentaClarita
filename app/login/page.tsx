'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserPlus } from 'lucide-react'
import { LoginBrandLogo, LoginBrandPanel } from '@/features/auth/login-brand-panel'
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
  const [showPassword, setShowPassword] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
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
    setSubmitting(true)
    try {
      const result = registering ? await signUp(name, email, password) : await signIn(email, password)
      if (!result.ok) {
        setError(result.message ?? 'No pudimos completar la acción.')
        return
      }
      if (registering) {
      setSuccess(result.message ?? 'Cuenta creada correctamente. Bienvenido a CuentaClarita.')
        window.setTimeout(() => router.replace('/'), 1200)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page min-h-[100dvh] md:grid md:grid-cols-[0.9fr_1.1fr] xl:grid-cols-2">
      <LoginBrandPanel />
      <section className="login-form-panel flex min-h-[100dvh] w-full items-center justify-center px-5 py-8 sm:px-8 md:px-6 lg:px-10 xl:px-14" aria-labelledby="login-title">
        <div className="login-form-content w-full max-w-lg">
          <div className="login-mobile-brand mb-6 flex justify-center md:hidden">
            <LoginBrandLogo className="login-logo-crop login-logo-crop-compact" />
          </div>

          <header className="login-form-header mb-7 text-center sm:mb-8">
            <h1 id="login-title" className="login-title text-3xl font-semibold tracking-tight sm:text-4xl">
              {registering ? 'Crear tu cuenta' : 'Bienvenido de nuevo'}
            </h1>
            <p className="login-subtitle mt-3 text-base sm:text-lg">
              {registering ? 'Crea tu cuenta para ordenar tus finanzas.' : 'Ingresa para continuar con tus finanzas.'}
            </p>
          </header>

          <div className="login-card">
            <form className="flex flex-col gap-4" onSubmit={submit}>
              {registering && (
                <div className="flex flex-col gap-2">
                  <Label className="login-label text-sm" htmlFor="name">Nombre</Label>
                  <div className="login-input-wrap">
                    <UserPlus className="login-field-icon" aria-hidden="true" />
                    <Input className="login-input h-14 rounded-xl pl-11 pr-4" id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" autoComplete="name" />
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label className="login-label text-sm" htmlFor="email">Correo electrónico</Label>
                <div className="login-input-wrap">
                  <Mail className="login-field-icon" aria-hidden="true" />
                  <Input className="login-input h-14 rounded-xl pl-11 pr-4" id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" autoComplete="email" required />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="login-label text-sm" htmlFor="password">Contraseña</Label>
                <div className="login-input-wrap">
                  <LockKeyhole className="login-field-icon" aria-hidden="true" />
                  <Input className="login-input h-14 rounded-xl pl-11 pr-12" id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 6 caracteres" autoComplete={registering ? 'new-password' : 'current-password'} required />
                  <button type="button" className="login-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>
              {error && <p className="login-error text-sm" role="alert">{error}</p>}
              {success && <p className="login-success text-sm" role="status">{success}</p>}
              <Button type="submit" size="lg" className="login-submit mt-2 h-14 w-full rounded-xl text-base font-semibold" disabled={submitting || Boolean(success)}>
                <span>{submitting ? 'Procesando...' : registering ? 'Crear cuenta' : 'Entrar a mi dashboard'}</span>
                {!submitting && <ArrowRight data-icon="inline-end" aria-hidden="true" />}
              </Button>
            </form>

            <p className="login-register-copy mt-6 text-center text-sm">
              {registering ? '¿Ya tienes una cuenta?' : '¿Todavía no tienes una cuenta?'}{' '}
              <button type="button" className="login-auth-toggle" onClick={() => { setRegistering((value) => !value); setError('') }}>
                {registering ? 'Inicia sesión' : 'Crear cuenta'}
              </button>
            </p>
          </div>

          <p className="login-security-note mt-5 flex items-center justify-center text-center text-xs leading-relaxed sm:text-sm">
            <ShieldCheck className="mr-2 size-5 shrink-0" aria-hidden="true" />
            <span>Tu acceso está protegido y listo para sincronizar tus finanzas.</span>
          </p>
          <Link href="/" className="sr-only">Ir al dashboard</Link>
        </div>
      </section>
    </main>
  )
}
