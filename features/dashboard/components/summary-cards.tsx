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
    <div
      className={cn(
        'dashboard-summary-card flex flex-col gap-4 rounded-2xl p-6',
        emphasis && 'bg-primary/10 ring-primary/20',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span
          className={cn(
            'dashboard-summary-icon flex size-10 items-center justify-center rounded-xl bg-accent text-muted-foreground',
            emphasis && 'bg-primary/15 text-primary',
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <Amount
        value={value}
        tone={tone}
        className="text-3xl font-semibold tracking-tight sm:text-[2rem]"
      />
    </div>
  )
}

export function SummaryCards({ summary }: { summary: MonthSummary }) {
  const availableTone = summary.available < 0 ? 'negative' : 'positive'

  return (
    <div className="grid gap-4 sm:grid-cols-3">
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
