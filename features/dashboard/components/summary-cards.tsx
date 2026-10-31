import { Wallet, Receipt, PiggyBank } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Amount } from '@/features/shared/components/amount'
import type { MonthSummary } from '@/features/store/finance-provider'

function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  emphasis = false,
}: {
  label: string
  value: number
  icon: LucideIcon
  tone?: 'default' | 'positive' | 'negative'
  emphasis?: boolean
}) {
  return (
    <article
      className={cn(
        'dashboard-summary-card flex min-w-0 items-center gap-4 rounded-2xl p-4 sm:p-5',
        emphasis && 'bg-primary/10 ring-primary/20',
      )}
    >
      <span
        className={cn(
          'dashboard-summary-icon flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-primary sm:size-14',
          emphasis && 'bg-primary/15 text-primary',
        )}
        aria-hidden="true"
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Amount
          value={value}
          tone={tone}
          className="mt-1 block text-[clamp(1.25rem,2.4vw,2rem)] font-semibold leading-tight"
        />
      </div>
    </article>
  )
}

export function SummaryCards({ summary }: { summary: MonthSummary }) {
  const availableTone = summary.available < 0 ? 'negative' : 'positive'

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Sueldo" value={summary.salary} icon={Wallet} />
      <StatCard
        label="Total de deudas"
        value={summary.totalDebts}
        icon={Receipt}
        tone={summary.totalDebts > 0 ? 'negative' : 'default'}
      />
      <StatCard
        label="Disponible"
        value={summary.available}
        icon={PiggyBank}
        tone={availableTone}
        emphasis
      />
    </div>
  )
}
