'use client'

import * as React from 'react'
import { History, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/features/shared/components/page-header'
import { EmptyState } from '@/features/shared/components/empty-state'
import { Amount } from '@/features/shared/components/amount'
import { useFinance } from '@/features/store/finance-provider'
import { monthName } from '@/features/shared/lib/format'
import { MonthDetailDialog } from '@/features/history/components/month-detail-dialog'
import type { Month } from '@/features/months/types'

export function HistoryView() {
  const { loaded, sortedMonths, getMonthSummary } = useFinance()
  const [selected, setSelected] = React.useState<Month | null>(null)

  if (!loaded) return null

  // Agrupar por año (descendente).
  const groups = new Map<number, Month[]>()
  for (const month of sortedMonths) {
    const list = groups.get(month.year) ?? []
    list.push(month)
    groups.set(month.year, list)
  }
  const years = [...groups.keys()].sort((a, b) => b - a)

  return (
    <>
      <PageHeader
        title="Historial"
        description="Consulta tus meses anteriores. Son de solo lectura."
      />

      {sortedMonths.length === 0 ? (
        <EmptyState
          icon={History}
          title="Tu historial está vacío"
          description="Cuando crees meses, aparecerán aquí organizados por año."
        />
      ) : (
        <div className="space-y-8">
          {years.map((year) => (
            <section key={year}>
              <div className="mb-2 flex items-center gap-3">
                <h2 className="text-sm font-semibold tabular-nums">{year}</h2>
                <span className="text-xs text-muted-foreground">
                  {groups.get(year)!.length}{' '}
                  {groups.get(year)!.length === 1 ? 'mes' : 'meses'}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <ul className="divide-y divide-border overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                {groups.get(year)!.map((month) => {
                  const summary = getMonthSummary(month.id)
                  return (
                    <li key={month.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(month)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {monthName(month.month)}
                            </span>
                            {month.status === 'active' ? (
                              <Badge variant="secondary" className="gap-1">
                                <span className="size-1.5 rounded-full bg-positive" />
                                Activo
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {summary.debtCount}{' '}
                            {summary.debtCount === 1 ? 'deuda' : 'deudas'} ·
                            Sueldo <Amount value={summary.salary} className="text-xs" />
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            Disponible
                          </p>
                          <Amount
                            value={summary.available}
                            tone={summary.available < 0 ? 'negative' : 'positive'}
                            className="text-sm font-medium"
                          />
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <MonthDetailDialog
        month={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  )
}
