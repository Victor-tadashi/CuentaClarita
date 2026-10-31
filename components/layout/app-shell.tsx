'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { LayoutDashboard, CalendarDays, History, LogOut, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/auth-provider'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/meses', label: 'Administrar Meses', icon: CalendarDays },
  { href: '/historial', label: 'Historial', icon: History },
] as const

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function Brand() {
  return (
    <Link href="/" className="flex items-center" aria-label="CuentaClarita, ir al inicio">
      <Image
        src="/brand/cuenta-clarita.png"
        alt="CuentaClarita — tus finanzas, siempre claras"
        width={220}
        height={92}
        className="dashboard-brand-image h-11 w-[10.5rem] rounded-md object-contain p-0.5"
        priority
      />
    </Link>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, loaded, signOut } = useAuth()

  if (pathname.startsWith('/login') || pathname.startsWith('/registro')) {
    return <>{children}</>
  }

  if (!loaded || !user) return null

  return (
    <div className="dashboard-shell min-h-screen md:flex">
      {/* Sidebar — escritorio */}
      <aside className="dashboard-sidebar sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r px-4 py-5 md:flex">
        <div className="dashboard-brand-frame px-2">
          <Brand />
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'dashboard-nav-item flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-4">
          <p className="px-2.5 text-xs leading-relaxed text-muted-foreground">
            ¿Cuánto dinero te quedará este mes después de pagar tus deudas?
          </p>
          <div className="dashboard-user-card flex items-center justify-between gap-2 rounded-xl p-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <UserCircle className="size-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{user.name}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Encabezado — móvil */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md md:hidden">
        <Brand />
        <button
          type="button"
          onClick={signOut}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut className="size-5" />
        </button>
      </header>

      {/* Contenido */}
      <main className="dashboard-main flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-8">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>

      {/* Navegación inferior — móvil */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border bg-background/90 backdrop-blur-md md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <item.icon className="size-5" />
              {item.label === 'Administrar Meses' ? 'Meses' : item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
