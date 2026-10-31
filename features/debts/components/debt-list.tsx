'use client'

import { Pencil, Trash2, CalendarClock, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Amount } from '@/features/shared/components/amount'
import { formatDueDate } from '@/features/shared/lib/format'
import { cn } from '@/lib/utils'
import type { Debt } from '@/features/debts/types'

export function DebtList({
  debts,
  editable = false,
  appearance = 'default',
  onEdit,
  onDelete,
}: {
  debts: Debt[]
  editable?: boolean
  appearance?: 'default' | 'dashboard'
  onEdit?: (debt: Debt) => void
  onDelete?: (debt: Debt) => void
}) {
  const dashboardAppearance = appearance === 'dashboard'

  return (
    <ul
      className={cn(
        'dashboard-debt-list',
        dashboardAppearance
          ? 'dashboard-home-debt-list'
          : 'divide-y overflow-hidden rounded-2xl',
      )}
    >
      {debts.map((debt, index) => {
        const due = formatDueDate(debt.dueDate)
        return (
          <li
            key={debt.id}
            className={cn(
              'dashboard-debt-row transition-colors hover:bg-accent/20',
              dashboardAppearance
                ? 'dashboard-home-debt-row'
                : 'flex items-center gap-4 px-5 py-4',
            )}
          >
            {dashboardAppearance ? (
              <span
                className="dashboard-home-debt-icon"
                data-tone={index % 4}
                aria-hidden="true"
              >
                <Receipt className="size-5" />
              </span>
            ) : null}
            <div
              className={cn(
                'min-w-0 flex-1',
                dashboardAppearance && 'dashboard-home-debt-main',
              )}
            >
              <p className="truncate text-sm font-medium">{debt.name}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                {due ? (
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="size-3" />
                    Vence {due}
                  </span>
                ) : null}
                {debt.notes ? (
                  <span
                    className={cn(
                      'truncate',
                      dashboardAppearance && 'dashboard-home-debt-note',
                    )}
                  >
                    {debt.notes}
                  </span>
                ) : null}
              </div>
            </div>

            <Amount
              value={debt.amount}
              className={cn(
                'text-sm font-medium',
                dashboardAppearance && 'dashboard-home-debt-amount',
              )}
            />

            {editable ? (
              <div
                className={cn(
                  'flex items-center gap-0.5',
                  dashboardAppearance && 'dashboard-home-debt-actions',
                )}
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Editar ${debt.name}`}
                  onClick={() => onEdit?.(debt)}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Eliminar ${debt.name}`}
                  className="text-muted-foreground hover:text-negative"
                  onClick={() => onDelete?.(debt)}
                >
                  <Trash2 />
                </Button>
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
