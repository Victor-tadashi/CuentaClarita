'use client'

import { CalendarDays, Check, Circle, Trash2 } from 'lucide-react'
import { getCalendarMonthStatus } from '@/features/store/finance-provider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Amount } from '@/features/shared/components/amount'
import { monthName } from '@/features/shared/lib/format'
import type { Month } from '@/features/months/types'
import type { MonthSummary } from '@/features/store/finance-provider'

export function MonthCard({
  month,
  summary,
  isActive,
  onDelete,
  onOpen,
}: {
  month: Month
  summary: MonthSummary
  isActive: boolean
  onDelete: () => void
  onOpen: () => void
}) {
  const calendarStatus = getCalendarMonthStatus(month)
  const statusLabel = isActive
    ? 'Mes activo'
    : calendarStatus === 'future'
      ? 'Próximo'
      : 'Finalizado'

  return (
    <article
      className="dashboard-month-card relative min-w-0 rounded-2xl transition-colors"
      data-active={isActive}
    >
      <button
        type="button"
        className="block w-full min-w-0 cursor-pointer rounded-[inherit] p-4 text-left text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/70"
        aria-haspopup="dialog"
        onClick={onOpen}
      >
        <div className="flex flex-wrap items-start justify-between gap-2 pr-11">
          <div className="flex min-w-0 items-center gap-3">
            <span className="month-card-icon" aria-hidden="true">
              <CalendarDays className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold leading-tight">
                {monthName(month.month)}
              </p>
              <p className="text-sm text-muted-foreground">{month.year}</p>
            </div>
          </div>
          <Badge
            variant={isActive ? 'default' : 'secondary'}
            className="month-card-badge gap-1 whitespace-nowrap"
            data-status={isActive ? 'active' : calendarStatus}
          >
            {isActive ? (
              <Circle className="size-2 fill-current" aria-hidden="true" />
            ) : calendarStatus === 'finished' ? (
              <Check className="size-3" aria-hidden="true" />
            ) : null}
            {statusLabel}
          </Badge>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Sueldo</dt>
            <dd>
              <Amount value={summary.salary} className="text-sm" />
            </dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Deudas</dt>
            <dd className="font-mono tabular-nums">{summary.debtCount}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Total deudas</dt>
            <dd>
              <Amount
                value={summary.totalDebts}
                tone={summary.totalDebts > 0 ? 'negative' : 'muted'}
                className="text-sm"
              />
            </dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Disponible</dt>
            <dd>
              <Amount
                value={summary.available}
                tone={summary.available < 0 ? 'negative' : 'positive'}
                className="text-sm font-semibold"
              />
            </dd>
          </div>
        </dl>
      </button>
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label={`Eliminar ${monthName(month.month)} ${month.year}`}
        className="absolute right-2.5 top-2.5 size-10 rounded-xl text-muted-foreground transition-colors hover:bg-negative/10 hover:text-negative"
        onClick={onDelete}
      >
        <Trash2 />
      </Button>
    </article>
  )
}
