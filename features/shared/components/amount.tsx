import { cn } from '@/lib/utils'
import { formatCurrency } from '@/features/shared/lib/format'

export function Amount({
  value,
  className,
  tone = 'default',
}: {
  value: number
  className?: string
  tone?: 'default' | 'positive' | 'negative' | 'muted'
}) {
  const toneClass = {
    default: 'text-foreground',
    positive: 'text-positive',
    negative: 'text-negative',
    muted: 'text-muted-foreground',
  }[tone]

  return (
    <span
      className={cn(
        'font-mono tabular-nums tracking-tight',
        toneClass,
        className,
      )}
    >
      {formatCurrency(value)}
    </span>
  )
}
