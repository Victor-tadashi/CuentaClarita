'use client'

import { Pencil, Trash2, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Amount } from '@/features/shared/components/amount'
import { formatDueDate } from '@/features/shared/lib/format'
import type { Debt } from '@/features/debts/types'

export function DebtList({
  debts,
  editable = false,
  onEdit,
  onDelete,
}: {
  debts: Debt[]
  editable?: boolean
  onEdit?: (debt: Debt) => void
  onDelete?: (debt: Debt) => void
}) {
  return (
    <ul className="dashboard-debt-list divide-y overflow-hidden rounded-2xl">
      {debts.map((debt) => {
        const due = formatDueDate(debt.dueDate)
        return (
          <li
            key={debt.id}
            className="dashboard-debt-row flex items-center gap-4 px-5 py-4 transition-colors hover:bg-accent/20"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{debt.name}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                {due ? (
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="size-3" />
                    Vence {due}
                  </span>
                ) : null}
                {debt.notes ? (
                  <span className="truncate">{debt.notes}</span>
                ) : null}
              </div>
            </div>

            <Amount value={debt.amount} className="text-sm font-medium" />

            {editable ? (
              <div className="flex items-center gap-0.5">
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
