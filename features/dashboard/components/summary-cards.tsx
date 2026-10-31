import { Wallet, Receipt, PiggyBank } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Amount } from '@/features/shared/components/amount'
import type { MonthSummary } from '@/features/store/finance-provider'

function StatCard({
  label,
  description,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string
  description: string
  value: number
  icon: LucideIcon
  tone?: 'default' | 'positive' | 'negative'
}) {
  return (
    <article className="dashboard-summary-card dashboard-home-summary-card">
      <span className="dashboard-summary-icon dashboard-home-summary-icon" aria-hidden="true">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="dashboard-home-summary-label">{label}</p>
        <Amount
          value={value}
          tone={tone}
          className="dashboard-home-summary-value"
        />
        <p className="dashboard-home-summary-description">{description}</p>
      </div>
    </article>
  )
}

export function SummaryCards({ summary }: { summary: MonthSummary }) {
  const availableTone = summary.available < 0 ? 'negative' : 'positive'

  return (
    <section className="dashboard-home-summary-grid" aria-label="Resumen financiero">
      <StatCard
        label="Sueldo"
        description="Ingreso mensual"
        value={summary.salary}
        icon={Wallet}
      />
      <StatCard
        label="Total de deudas"
        description="Gastos registrados"
        value={summary.totalDebts}
        icon={Receipt}
        tone={summary.totalDebts > 0 ? 'negative' : 'default'}
      />
      <StatCard
        label="Disponible"
        description="Después de tus deudas"
        value={summary.available}
        icon={PiggyBank}
        tone={availableTone}
      />
    </section>
  )
}
