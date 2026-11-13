'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/auth-provider'
import { createClient } from '@/lib/supabase/client'

const RECOVERY_PASSWORD_PATH = '/recuperar-contrasena/nueva'

function RecoveryLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="login-page recovery-page">
      <div className="login-orb login-orb-left" aria-hidden="true" />
      <div className="login-orb login-orb-right" aria-hidden="true" />
      <div className="login-shell">
        <header className="login-topbar">
          <Link href="/login" className="login-brand" aria-label="CuentaClarita, volver al inicio de sesión">
            <Image
              src="/brand/cuenta-clarita.png"
              alt=""
              width={1600}
              height={533}
              sizes="(max-width: 639px) 45vw, 11.5rem"
              className="brand-logo-image"
              priority
            />
          </Link>
          <span className="login-topbar-note">Gestión financiera personal</span>
        </header>

        <div className="login-layout">
          <section className="login-hero" aria-labelledby="recovery-hero-title">
            <p className="login-eyebrow">
              <span aria-hidden="true" />
              Recupera tu acceso de forma segura
            </p>
            <h1 className="login-headline" id="recovery-hero-title">
              <span>Más claridad para</span>
              <span className="login-headline-gradient">cada fin de mes.</span>
            </h1>
            <p className="login-hero-description">
              Vuelve a tus finanzas con una contraseña nueva y segura. Tu información permanece protegida.
            </p>
            <ul className="login-benefits">
              <li><Check className="size-4" aria-hidden="true" />Enlace de un solo uso</li>
              <li><Check className="size-4" aria-hidden="true" />Acceso protegido</li>
            </ul>
          </section>

          <section className="login-auth-column" aria-label="Recuperación de contraseña">
            <div className="login-card">{children}</div>
            <p className="login-security-note">
              <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
              <span>Autenticación segura gestionada con Supabase.</span>
            </p>
          </section>
        </div>

        <footer className="login-footer">
          <span>© CuentaClarita · Tus finanzas claras, mes a mes.</span>
          <span className="login-footer-promise">Tus datos permanecen protegidos.</span>
        </footer>
      </div>
    </main>
  )
}

function RecoveryHeading({
  icon,
  title,
  description,
  success = false,
}: {
  icon: React.ReactNode
  title: string
  description: string
  success?: boolean
}) {
  return (
    <div className="login-card-heading">
      <span className={`login-icon${success ? ' recovery-success-icon' : ''}`} aria-hidden="true">
        {icon}
      </span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  )
}

function LoginLink({ children = 'Volver a iniciar sesión' }: { children?: React.ReactNode }) {
  return (
    <p className="login-signup mt-6 text-center text-sm text-muted-foreground">
      <Link href="/login"><ArrowLeft className="mr-1 inline size-4" aria-hidden="true" />{children}</Link>
    </p>
  )
}

export function PasswordRecoveryRequest() {
  const [email, setEmail] = React.useState('')
  const [error, setError] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSent, setIsSent] = React.useState(false)
  const submittingRef = React.useRef(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    const normalizedEmail = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Ingresa un correo electrónico válido.')
      return
    }

    setError('')
    submittingRef.current = true
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const callbackUrl = new URL(
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
      )
      callbackUrl.searchParams.set('next', '/auth/confirm')

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: callbackUrl.toString(),
      })

      if (resetError) {
        setError(
          resetError.status === 429 || resetError.code === 'over_email_send_rate_limit'
            ? 'Se alcanzó el límite de solicitudes. Espera un momento antes de intentarlo de nuevo.'
            : 'No pudimos enviar el enlace ahora. Inténtalo nuevamente más tarde.',
        )
        return
      }

      setIsSent(true)
    } catch {
      setError('No pudimos conectar con el servicio. Revisa tu conexión e inténtalo nuevamente.')
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  if (isSent) {
    return (
      <RecoveryLayout>
        <RecoveryHeading
          icon={<CheckCircle2 className="size-6" />}
          title="Revisa tu correo"
          description="Si el correo ingresado está registrado en CuentaClarita, recibirás un enlace para restablecer tu contraseña."
          success
        />
        <Link href="/login" className="login-submit recovery-primary-link">
          <ArrowLeft className="size-5" aria-hidden="true" />
          Volver al login
        </Link>
      </RecoveryLayout>
    )
  }

  return (
    <RecoveryLayout>
      <RecoveryHeading
        icon={<Mail className="size-6" />}
        title="¿Olvidaste tu contraseña?"
        description="Ingresa tu correo electrónico y te enviaremos un enlace para recuperar el acceso."
      />

      <form className="login-form flex flex-col" onSubmit={submit} noValidate>
        <div className="login-field flex flex-col gap-2">
          <Label className="text-sm" htmlFor="recovery-email">Correo electrónico</Label>
          <div className="login-input-wrap">
            <Mail className="login-field-icon" aria-hidden="true" />
            <Input
              className="login-input h-[3.25rem] rounded-xl pl-11 pr-4"
              id="recovery-email"
              type="email"
              value={email}
              onChange={(event) => { setEmail(event.target.value); setError('') }}
              placeholder="tu@correo.com"
              autoComplete="email"
              aria-invalid={error === 'Ingresa un correo electrónico válido.'}
              aria-describedby={error ? 'recovery-email-error' : undefined}
              required
            />
          </div>
        </div>

        {error && <p className="login-message login-error" id="recovery-email-error" role="alert">{error}</p>}

        <Button type="submit" size="lg" className="login-submit mt-2 h-14 w-full rounded-xl text-base font-semibold" disabled={isSubmitting}>
          {isSubmitting
            ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            : <Send className="size-5" aria-hidden="true" />}
          <span>{isSubmitting ? 'Enviando enlace…' : 'Enviar enlace de recuperación'}</span>
        </Button>
      </form>

      <LoginLink />
    </RecoveryLayout>
  )
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  error,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  visible: boolean
  onToggle: () => void
  error: boolean
}) {
  return (
    <div className="login-field flex flex-col gap-2">
      <Label className="text-sm" htmlFor={id}>{label}</Label>
      <div className="login-input-wrap">
        <LockKeyhole className="login-field-icon" aria-hidden="true" />
        <Input
          className="login-input h-[3.25rem] rounded-xl pl-11 pr-12"
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
          aria-invalid={error}
          aria-describedby={error ? 'recovery-password-error' : undefined}
          required
        />
        <button
          type="button"
          className="login-password-toggle"
          onClick={onToggle}
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

type RecoveryGrantForForm = { userId: string; sessionId: string; expiresAt: number } | null

export function PasswordRecoveryUpdate({ recoveryGrant }: { recoveryGrant: RecoveryGrantForForm }) {
  const { loaded, user, sessionId } = useAuth()
  const [password, setPassword] = React.useState('')
  const [confirmation, setConfirmation] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmation, setShowConfirmation] = React.useState(false)
  const [error, setError] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isComplete, setIsComplete] = React.useState(false)
  const [expiredGrantKey, setExpiredGrantKey] = React.useState<string | null>(null)
  const submittingRef = React.useRef(false)
  const recoveryGrantKey = recoveryGrant
    ? `${recoveryGrant.userId}:${recoveryGrant.sessionId}:${recoveryGrant.expiresAt}`
    : null

  React.useEffect(() => {
    if (!recoveryGrant || !recoveryGrantKey) return

    const remaining = recoveryGrant.expiresAt - Date.now()
    if (remaining <= 0) {
      setExpiredGrantKey(recoveryGrantKey)
      return
    }

    const timeout = window.setTimeout(() => setExpiredGrantKey(recoveryGrantKey), remaining)
    return () => window.clearTimeout(timeout)
  }, [recoveryGrant, recoveryGrantKey])

  const recoveryAuthorized = Boolean(
    loaded &&
    recoveryGrantKey !== expiredGrantKey &&
    recoveryGrant &&
    user?.id === recoveryGrant.userId &&
    sessionId === recoveryGrant.sessionId,
  )

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    if (!password || !confirmation) {
      setError('Completa ambos campos para continuar.')
      return
    }
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setError('')
    submittingRef.current = true
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        cache: 'no-store',
      })
      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.ok) {
        if (result?.code === 'weak_password') {
          setError('La contraseña no cumple los requisitos de seguridad configurados. Elige otra e inténtalo nuevamente.')
        } else if (response.status === 429) {
          setError('Se alcanzó el límite de intentos. Espera un momento antes de intentarlo de nuevo.')
        } else {
          setError('El enlace de recuperación ya no es válido. Solicita uno nuevo para continuar.')
        }
        return
      }

      setIsComplete(true)
      await createClient().auth.signOut({ scope: 'local' })
    } catch {
      setError('No pudimos completar la solicitud. Solicita un enlace nuevo e inténtalo otra vez.')
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  if (isComplete) {
    return (
      <RecoveryLayout>
        <RecoveryHeading
          icon={<CheckCircle2 className="size-6" />}
          title="Contraseña actualizada"
          description="Tu contraseña se ha cambiado correctamente."
          success
        />
        <Link href="/login" className="login-submit recovery-primary-link">
          <span>Iniciar sesión</span>
          <ArrowRight className="size-5" aria-hidden="true" />
        </Link>
      </RecoveryLayout>
    )
  }

  if (!loaded) {
    return (
      <RecoveryLayout>
        <RecoveryHeading
          icon={<LoaderCircle className="size-6 animate-spin" />}
          title="Verificando enlace"
          description="Estamos comprobando que el enlace de recuperación siga vigente."
        />
        <p className="login-message" role="status">Espera un momento para continuar.</p>
      </RecoveryLayout>
    )
  }

  if (!recoveryAuthorized) {
    return (
      <RecoveryLayout>
        <RecoveryHeading
          icon={<CircleAlert className="size-6" />}
          title="Enlace no válido"
          description="Este enlace no es válido, ya expiró o se abrió en otro navegador. Solicita uno nuevo para continuar."
        />
        <Link href="/recuperar-contrasena" className="login-submit recovery-primary-link">
          Solicitar otro enlace
          <ArrowRight className="size-5" aria-hidden="true" />
        </Link>
        <LoginLink />
      </RecoveryLayout>
    )
  }

  return (
    <RecoveryLayout>
      <RecoveryHeading
        icon={<LockKeyhole className="size-6" />}
        title="Crea tu nueva contraseña"
        description="Ingresa una nueva contraseña para recuperar el acceso a tu cuenta."
      />

      <form className="login-form flex flex-col" onSubmit={submit}>
        <PasswordField
          id="new-password"
          label="Nueva contraseña"
          value={password}
          onChange={(value) => { setPassword(value); setError('') }}
          visible={showPassword}
          onToggle={() => setShowPassword((value) => !value)}
          error={Boolean(error)}
        />
        <PasswordField
          id="confirm-password"
          label="Confirmar contraseña"
          value={confirmation}
          onChange={(value) => { setConfirmation(value); setError('') }}
          visible={showConfirmation}
          onToggle={() => setShowConfirmation((value) => !value)}
          error={Boolean(error)}
        />

        {error && <p className="login-message login-error" id="recovery-password-error" role="alert">{error}</p>}

        <Button type="submit" size="lg" className="login-submit mt-2 h-14 w-full rounded-xl text-base font-semibold" disabled={isSubmitting}>
          {isSubmitting
            ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            : <LockKeyhole className="size-5" aria-hidden="true" />}
          <span>{isSubmitting ? 'Guardando…' : 'Guardar nueva contraseña'}</span>
        </Button>
      </form>

      <LoginLink />
    </RecoveryLayout>
  )
}
