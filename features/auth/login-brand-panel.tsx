import Image from 'next/image'
import {
  CalendarDays,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react'

type LoginBrandLogoProps = {
  className: string
}

export function LoginBrandLogo({ className }: LoginBrandLogoProps) {
  return (
    <div className={className}>
      <Image
        src="/brand/cuenta-clarita.png"
        alt="CuentaClarita — tus finanzas, siempre claras"
        width={1536}
        height={1024}
        sizes="(max-width: 767px) 208px, 264px"
        className="login-brand-image"
        loading="eager"
      />
    </div>
  )
}

export function LoginBrandPanel() {
  return (
    <aside className="login-brand-panel hidden md:flex" aria-labelledby="login-brand-heading">
      <div className="login-brand-content">
        <header className="login-brand-header">
          <LoginBrandLogo className="login-logo-crop" />
          <p className="login-brand-label">FINANZAS PERSONALES</p>
        </header>

        <div className="login-brand-copy">
          <p className="login-brand-eyebrow">CONTROL SIMPLE, DECISIONES CLARAS</p>
          <h2 id="login-brand-heading" className="login-brand-title">
            Tus cuentas claras.
            <br />
            Tu <span>tranquilidad</span> también.
          </h2>
          <p className="login-brand-description">
            Organiza tus deudas, controla tus gastos y descubre cuánto dinero te queda.
          </p>
        </div>

        <section className="login-demo" aria-label="Vista demostrativa con datos de ejemplo">
          <div className="login-demo-header">
            <div className="login-demo-heading">
              <span className="login-demo-mark" aria-hidden="true">
                <Wallet />
              </span>
              <div>
                <p className="login-demo-overline">VISTA DEMOSTRATIVA</p>
                <p className="login-demo-caption">Resumen mensual</p>
              </div>
            </div>
            <span className="login-demo-period">Ejemplo</span>
          </div>

          <div className="login-demo-grid">
            <article className="login-demo-card">
              <div className="login-demo-card-top">
                <span className="login-demo-icon login-demo-icon-teal" aria-hidden="true">
                  <CalendarDays />
                </span>
                <span className="login-demo-unit">ESTE MES</span>
              </div>
              <p className="login-demo-card-label">Gastos del mes</p>
              <p className="login-demo-card-value">$245.000</p>
              <p className="login-demo-trend">↓ 12% vs. mes anterior</p>
            </article>

            <article className="login-demo-card">
              <div className="login-demo-card-top">
                <span className="login-demo-icon login-demo-icon-coral" aria-hidden="true">
                  <CreditCard />
                </span>
                <span className="login-demo-unit">PENDIENTE</span>
              </div>
              <p className="login-demo-card-label">Deudas pendientes</p>
              <p className="login-demo-card-value">$86.500</p>
              <p className="login-demo-trend login-demo-trend-neutral">2 pagos previstos</p>
            </article>

            <article className="login-demo-card">
              <div className="login-demo-card-top">
                <span className="login-demo-icon login-demo-icon-teal" aria-hidden="true">
                  <Wallet />
                </span>
                <span className="login-demo-unit">DISPONIBLE</span>
              </div>
              <p className="login-demo-card-label">Saldo disponible</p>
              <p className="login-demo-card-value">$318.000</p>
              <p className="login-demo-trend">Para tus próximos gastos</p>
            </article>

            <article className="login-demo-chart">
              <div className="login-demo-chart-header">
                <span>Balance mensual</span>
                <TrendingUp aria-hidden="true" />
              </div>
              <div className="login-chart-bars" aria-hidden="true">
                <span className="login-chart-bar login-chart-bar-one" />
                <span className="login-chart-bar login-chart-bar-two" />
                <span className="login-chart-bar login-chart-bar-three" />
                <span className="login-chart-bar login-chart-bar-four" />
                <span className="login-chart-bar login-chart-bar-five" />
                <span className="login-chart-bar login-chart-bar-six" />
              </div>
            </article>
          </div>

          <p className="login-demo-disclaimer">
            <ShieldCheck aria-hidden="true" />
            Cifras ilustrativas; no corresponden a una cuenta real.
          </p>
        </section>

        <p className="login-brand-footer">
          <ShieldCheck aria-hidden="true" />
          Un vistazo claro para decidir con calma.
        </p>
      </div>
    </aside>
  )
}
