'use client'

import { Trash2 } from 'lucide-react'
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
  onDelete,
  onOpen,
}: {
  month: Month
  summary: MonthSummary
  onDelete: () => void
  onOpen: () => void
}) {
  const calendarStatus = getCalendarMonthStatus(month)
  const statusLabel = calendarStatus === 'current' ? 'Mes activo' : calendarStatus === 'future' ? 'Próximo' : 'Finalizado'
  const isActive = calendarStatus === 'current'

  return (
    <div
      className="dashboard-month-card flex cursor-pointer flex-col gap-4 rounded-2xl p-5"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-semibold leading-tight">
            {monthName(month.month)}
          </p>
          <p className="text-sm text-muted-foreground">{month.year}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant={isActive ? 'default' : 'secondary'} className="gap-1">
            {isActive ? (
              <span className="size-1.5 rounded-full bg-primary-foreground" />
            ) : null}
            {statusLabel}
          </Badge>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Eliminar ${monthName(month.month)} ${month.year}`}
            className="text-muted-foreground hover:text-negative"
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
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
    </div>
  )
}
