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
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/brand/cuenta-clarita.png"
            alt="CuentaClarita — tus finanzas, siempre claras"
            width={560}
            height={240}
            className="mb-4 h-24 w-full max-w-[22rem] rounded-xl bg-card object-contain p-2"
            priority
          />
          <h1 className="sr-only">CuentaClarita</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {registering ? 'Crea tu cuenta para ordenar tus finanzas.' : 'Tus finanzas claras, mes a mes.'}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-primary">
              {registering ? <UserPlus className="size-4" /> : <LogIn className="size-4" />}
            </span>
            <div>
              <h2 className="font-semibold">{registering ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
              <p className="text-xs text-muted-foreground">Acceso seguro con Supabase.</p>
            </div>
          </div>

          <form className="flex flex-col gap-4" onSubmit={submit}>
            {registering && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" autoComplete="name" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" autoComplete="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 6 caracteres" autoComplete={registering ? 'new-password' : 'current-password'} required />
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            {success && <p className="text-sm text-primary" role="status">{success}</p>}
            <Button type="submit" size="lg" className="mt-2 w-full" disabled={Boolean(success)}>
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
        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          Tu acceso está protegido y listo para sincronizar tus finanzas.
        </p>
        <Link href="/" className="sr-only">Ir al dashboard</Link>
      </section>
    </main>
  )
}
