'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowRight, Eye, EyeOff, LockKeyhole, LogIn, Mail, ShieldCheck, UserPlus } from 'lucide-react'
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
    <main className="login-page flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
      <div className="login-orb login-orb-left" aria-hidden="true" />
      <div className="login-orb login-orb-right" aria-hidden="true" />
      <section className="login-content w-full max-w-lg">
        <div className="mb-7 flex flex-col items-center text-center sm:mb-9">
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
          <p className="mt-5 text-base text-muted-foreground sm:text-lg">
            {registering ? 'Crea tu cuenta para ordenar tus finanzas.' : 'Tus finanzas claras, mes a mes.'}
          </p>
        </div>

        <div className="login-card rounded-[1.5rem] p-5 sm:p-8">
          <div className="mb-7 flex items-center gap-4">
            <span className="login-icon flex size-12 shrink-0 items-center justify-center rounded-2xl">
              {registering ? <UserPlus className="size-6" /> : <LogIn className="size-6" />}
            </span>
            <div>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{registering ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">Acceso seguro con Supabase.</p>
            </div>
          </div>

          <form className="flex flex-col gap-4" onSubmit={submit}>
            {registering && (
              <div className="flex flex-col gap-2">
                <Label className="text-sm" htmlFor="name">Nombre</Label>
                <div className="login-input-wrap">
                  <UserPlus className="login-field-icon" aria-hidden="true" />
                  <Input className="login-input h-14 rounded-xl pl-11 pr-4" id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" autoComplete="name" />
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label className="text-sm" htmlFor="email">Correo electrónico</Label>
              <div className="login-input-wrap">
                <Mail className="login-field-icon" aria-hidden="true" />
                <Input className="login-input h-14 rounded-xl pl-11 pr-4" id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" autoComplete="email" required />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm" htmlFor="password">Contraseña</Label>
              <div className="login-input-wrap">
                <LockKeyhole className="login-field-icon" aria-hidden="true" />
                <Input className="login-input h-14 rounded-xl pl-11 pr-12" id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 6 caracteres" autoComplete={registering ? 'new-password' : 'current-password'} required />
                <button type="button" className="login-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            {success && <p className="text-sm text-primary" role="status">{success}</p>}
            <Button type="submit" size="lg" className="login-submit mt-2 h-14 w-full rounded-xl text-base font-semibold" disabled={submitting || Boolean(success)}>
              <span>{submitting ? 'Procesando...' : registering ? 'Crear cuenta' : 'Entrar a mi dashboard'}</span>
              {!submitting && <ArrowRight className="size-5" aria-hidden="true" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {registering ? '¿Ya tienes una cuenta?' : '¿Todavía no tienes una cuenta?'}{' '}
            <button type="button" className="font-medium text-primary hover:underline" onClick={() => { setRegistering((value) => !value); setError('') }}>
              {registering ? 'Inicia sesión' : 'Crear cuenta'}
            </button>
          </p>
        </div>
        <p className="login-security-note mt-7 flex items-center justify-center text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
          <ShieldCheck className="mr-2 size-5 shrink-0 text-primary" aria-hidden="true" />
          <span>Tu acceso está protegido y listo para sincronizar tus finanzas.</span>
        </p>
        <Link href="/" className="sr-only">Ir al dashboard</Link>
      </section>
    </main>
  )
}
