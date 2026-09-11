'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Amount } from '@/features/shared/components/amount'
import { DebtList } from '@/features/debts/components/debt-list'
import { monthLabel } from '@/features/shared/lib/format'
import { useFinance } from '@/features/store/finance-provider'
import type { Month } from '@/features/months/types'

export function MonthDetailDialog({
  month,
  onOpenChange,
}: {
  month: Month | null
  onOpenChange: (open: boolean) => void
}) {
  const { getMonthDebts, getMonthSummary } = useFinance()

  const debts = month ? getMonthDebts(month.id) : []
  const summary = month
    ? getMonthSummary(month.id)
    : { salary: 0, totalDebts: 0, available: 0, debtCount: 0 }

  return (
    <Dialog open={month !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {month ? (
          <>
            <DialogHeader>
              <DialogTitle>{monthLabel(month.month, month.year)}</DialogTitle>
              <DialogDescription>Resumen de solo lectura.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-2">
              <div className="modal-summary-card rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Sueldo</p>
                <Amount value={summary.salary} className="text-sm font-medium" />
              </div>
              <div className="modal-summary-card rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Deudas</p>
                <Amount
                  value={summary.totalDebts}
                  tone="negative"
                  className="text-sm font-medium"
                />
              </div>
              <div className="rounded-xl bg-primary/10 p-3">
                <p className="text-xs text-muted-foreground">Disponible</p>
                <Amount
                  value={summary.available}
                  tone={summary.available < 0 ? 'negative' : 'positive'}
                  className="text-sm font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Deudas ({debts.length})
              </p>
              {debts.length === 0 ? (
                <p className="rounded-xl bg-card p-4 text-sm text-muted-foreground ring-1 ring-foreground/10">
                  Este mes no tiene deudas registradas.
                </p>
              ) : (
                <div className="modal-debt-scroll max-h-64 overflow-y-auto">
                  <DebtList debts={debts} />
                </div>
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
