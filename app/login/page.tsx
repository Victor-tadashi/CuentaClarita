'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/auth-provider'

function MonthlyFinancePreview() {
  return (
    <section className="login-finance-preview" aria-label="Resumen mensual de ejemplo">
      <div className="login-finance-preview-header">
        <h2>Resumen mensual</h2>
        <span>Ejemplo · Octubre</span>
      </div>
      <div className="login-preview-metrics">
        <article className="login-preview-metric">
          <p>Sueldo del mes</p>
          <strong>$1.250.000</strong>
          <span className="login-preview-income">Ingreso registrado</span>
        </article>
        <article className="login-preview-metric">
          <p>Total de deudas</p>
          <strong>$435.000</strong>
          <span className="login-preview-expense">Gastos registrados</span>
        </article>
      </div>
      <div className="login-preview-balance">
        <div>
          <p>Saldo disponible</p>
          <strong>$815.000</strong>
        </div>
        <div className="login-preview-chart" aria-hidden="true">
          <span className="login-preview-bar" />
          <span className="login-preview-bar" />
          <span className="login-preview-bar" />
          <span className="login-preview-bar" />
          <span className="login-preview-bar" />
          <span className="login-preview-bar" />
          <span className="login-preview-bar" />
        </div>
      </div>
    </section>
  )
}

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
    <main className="login-page">
      <div className="login-orb login-orb-left" aria-hidden="true" />
      <div className="login-orb login-orb-right" aria-hidden="true" />
      <div className="login-shell">
        <header className="login-topbar">
          <div className="login-brand">
            <span className="login-brand-mark" aria-hidden="true">
              <Image
                src="/brand/cuenta-clarita.png"
                alt=""
                width={1536}
                height={1024}
                className="login-brand-mark-image"
                priority
              />
            </span>
            <span className="login-brand-name">
              Cuenta<span>Clarita</span>
            </span>
          </div>
          <span className="login-topbar-note">Tus finanzas, más simples</span>
        </header>

        <div className="login-layout">
          <section className="login-hero" aria-labelledby="login-hero-title">
            <p className="login-eyebrow">
              <span aria-hidden="true" />
              Control financiero sin complicaciones
            </p>
            <h1 className="login-headline" id="login-hero-title">
              <span>Más claridad para</span>
              <span className="login-headline-gradient">cada fin de mes.</span>
            </h1>
            <p className="login-hero-description">
              Tu sueldo, tus deudas y lo que realmente tienes disponible. Todo organizado en un solo lugar.
            </p>
            <ul className="login-benefits">
              <li><Check className="size-4" aria-hidden="true" />Organiza tus deudas</li>
              <li><Check className="size-4" aria-hidden="true" />Controla cada mes</li>
            </ul>
            <MonthlyFinancePreview />
          </section>

          <section className="login-auth-column" aria-labelledby="login-card-title">
            <div className="login-card">
              <div className="login-card-heading">
                <span className="login-icon" aria-hidden="true">
                  {registering ? <UserPlus className="size-6" /> : <LockKeyhole className="size-6" />}
                </span>
                <div>
                  <h2 id="login-card-title">{registering ? 'Crear cuenta' : 'Bienvenido de nuevo'}</h2>
                  <p>{registering ? 'Crea tu cuenta para continuar con tus finanzas.' : 'Inicia sesión para continuar con tus finanzas.'}</p>
                </div>
              </div>

              <form className="login-form flex flex-col gap-4" onSubmit={submit}>
                {registering && (
                  <div className="login-field flex flex-col gap-2">
                    <Label className="text-sm" htmlFor="name">Nombre</Label>
                    <div className="login-input-wrap">
                      <UserPlus className="login-field-icon" aria-hidden="true" />
                      <Input className="login-input h-[3.25rem] rounded-xl pl-11 pr-4" id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" autoComplete="name" />
                    </div>
                  </div>
                )}
                <div className="login-field flex flex-col gap-2">
                  <Label className="text-sm" htmlFor="email">Correo electrónico</Label>
                  <div className="login-input-wrap">
                    <Mail className="login-field-icon" aria-hidden="true" />
                    <Input className="login-input h-[3.25rem] rounded-xl pl-11 pr-4" id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" autoComplete="email" required />
                  </div>
                </div>
                <div className="login-field flex flex-col gap-2">
                  <Label className="text-sm" htmlFor="password">Contraseña</Label>
                  <div className="login-input-wrap">
                    <LockKeyhole className="login-field-icon" aria-hidden="true" />
                    <Input className="login-input h-[3.25rem] rounded-xl pl-11 pr-12" id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ingresa tu contraseña" autoComplete={registering ? 'new-password' : 'current-password'} required />
                    <button type="button" className="login-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>
                {error && <p className="login-message login-error" role="alert">{error}</p>}
                {success && <p className="login-message login-success" role="status">{success}</p>}
                <Button type="submit" size="lg" className="login-submit mt-2 h-14 w-full rounded-xl text-base font-semibold" disabled={submitting || Boolean(success)}>
                  <span>{submitting ? 'Procesando...' : registering ? 'Crear cuenta' : 'Entrar a mi dashboard'}</span>
                  {!submitting && <ArrowRight className="size-5" aria-hidden="true" />}
                </Button>
              </form>

              <p className="login-signup mt-6 text-center text-sm text-muted-foreground">
                {registering ? '¿Ya tienes una cuenta?' : '¿Todavía no tienes una cuenta?'}{' '}
                <button type="button" className="font-medium text-primary hover:underline" onClick={() => { setRegistering((value) => !value); setError('') }}>
                  {registering ? 'Inicia sesión' : 'Crear cuenta'}
                </button>
              </p>
            </div>
            <p className="login-security-note">
              <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
              <span>Inicio de sesión gestionado con Supabase.</span>
            </p>
          </section>
        </div>

        <footer className="login-footer">
          <span>© CuentaClarita · Tus finanzas claras, mes a mes.</span>
          <span className="login-footer-promise">Organiza tu dinero con tranquilidad.</span>
        </footer>
        <Link href="/" className="sr-only">Ir al dashboard</Link>
      </div>
    </main>
  )
}
