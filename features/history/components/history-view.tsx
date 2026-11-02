'use client'

import * as React from 'react'
import {
  CalendarDays,
  ChevronRight,
  Coins,
  History,
  Layers3,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/features/shared/components/page-header'
import { EmptyState } from '@/features/shared/components/empty-state'
import { Amount } from '@/features/shared/components/amount'
import { useFinance, type MonthSummary } from '@/features/store/finance-provider'
import { monthLabel, monthName } from '@/features/shared/lib/format'
import { MonthDetailDialog } from '@/features/history/components/month-detail-dialog'
import type { Month } from '@/features/months/types'
import { cn } from '@/lib/utils'

function HistorySummaryCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: LucideIcon
  label: string
  value: React.ReactNode
  description: string
}) {
  return (
    <article className="dashboard-summary-card history-summary-card">
      <span className="dashboard-summary-icon history-summary-icon" aria-hidden="true">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="history-summary-label">{label}</p>
        {value}
        <p className="history-summary-description">{description}</p>
      </div>
    </article>
  )
}

function HistorySummaryCards({
  monthCount,
  totalDebts,
  availableTotal,
}: {
  monthCount: number
  totalDebts: number
  availableTotal: number
}) {
  return (
    <section className="history-summary-grid" aria-label="Resumen histórico">
      <HistorySummaryCard
        icon={CalendarDays}
        label="Meses registrados"
        value={<span className="history-summary-value">{monthCount}</span>}
        description="Meses con información guardada"
      />
      <HistorySummaryCard
        icon={Layers3}
        label="Total de deudas (histórico)"
        value={
          <Amount
            value={totalDebts}
            tone={totalDebts > 0 ? 'negative' : 'default'}
            className="history-summary-value"
          />
        }
        description="Suma de las deudas registradas"
      />
      <HistorySummaryCard
        icon={Coins}
        label="Disponible acumulado (histórico)"
        value={
          <Amount
            value={availableTotal}
            tone={availableTotal < 0 ? 'negative' : 'positive'}
            className="history-summary-value"
          />
        }
        description="Suma de saldos mensuales; no es el saldo actual"
      />
    </section>
  )
}

function HistoryMetric({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: LucideIcon
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('history-row-metric', className)}>
      <Icon className="history-row-metric-icon" aria-hidden="true" />
      <div className="history-row-metric-content">
        <span className="history-row-metric-label">{label}</span>
        {children}
      </div>
    </div>
  )
}

function HistoryMonthRow({
  month,
  summary,
  onOpen,
}: {
  month: Month
  summary: MonthSummary
  onOpen: () => void
}) {
  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        className={cn(
          'dashboard-history-row history-row-button',
          month.status === 'active' && 'history-row-button-active',
        )}
      >
        <div className="history-row-month">
          <span className="history-row-calendar" aria-hidden="true">
            <CalendarDays className="size-5" />
          </span>
          <div className="history-row-month-copy">
            <h3 className="history-row-month-name">{monthName(month.month)}</h3>
            <p className="history-row-month-year">{month.year}</p>
          </div>
          <Badge
            variant="secondary"
            className="history-status-badge"
            data-status={month.status}
          >
            <span className="history-status-dot" aria-hidden="true" />
            {month.status === 'active' ? 'Activo' : 'Finalizado'}
          </Badge>
        </div>

        <div className="history-row-metrics">
          <HistoryMetric icon={Layers3} label="Deudas" className="history-row-debt-count">
            <span className="history-row-metric-value">{summary.debtCount}</span>
          </HistoryMetric>
          <HistoryMetric icon={WalletCards} label="Sueldo">
            <Amount value={summary.salary} className="history-row-metric-value" />
          </HistoryMetric>
          <HistoryMetric icon={Layers3} label="Total de deudas" className="history-row-total-debts">
            <Amount
              value={summary.totalDebts}
              tone="negative"
              className="history-row-metric-value"
            />
          </HistoryMetric>
          <HistoryMetric icon={Coins} label="Disponible" className="history-row-available">
            <Amount
              value={summary.available}
              tone={summary.available < 0 ? 'negative' : 'positive'}
              className="history-row-metric-value"
            />
          </HistoryMetric>
        </div>

        <span className="sr-only">
          Ver el detalle de {monthLabel(month.month, month.year)}
        </span>
        <ChevronRight className="history-row-chevron" aria-hidden="true" />
      </button>
    </li>
  )
}

export function HistoryView() {
  const {
    loaded,
    loadingError,
    loadingMessage,
    retryLoad,
    sortedMonths,
    getMonthSummary,
  } = useFinance()
  const [selected, setSelected] = React.useState<Month | null>(null)

  if (!loaded) {
    return (
      <div className="history-page-state" role="status">
        {loadingMessage ?? 'Cargando historial...'}
      </div>
    )
  }

  if (loadingError) {
    return (
      <div className="history-page-state history-page-error" role="alert">
        <p>{loadingError}</p>
        <button type="button" className="history-retry-button" onClick={retryLoad}>
          Reintentar
        </button>
      </div>
    )
  }

  const summariesByMonth = new Map<string, MonthSummary>()
  let historicalDebtTotal = 0
  let historicalAvailableTotal = 0

  for (const month of sortedMonths) {
    const summary = getMonthSummary(month.id)
    summariesByMonth.set(month.id, summary)
    historicalDebtTotal += summary.totalDebts
    historicalAvailableTotal += summary.available
  }

  const groups = new Map<number, Month[]>()
  for (const month of sortedMonths) {
    const list = groups.get(month.year) ?? []
    list.push(month)
    groups.set(month.year, list)
  }
  const years = [...groups.keys()].sort((a, b) => b - a)

  return (
    <div className="history-page">
      <PageHeader
        title="Historial"
        description="Consulta tus meses anteriores. Son de solo lectura."
        icon={History}
        className="history-page-header"
      />

      {sortedMonths.length === 0 ? (
        <EmptyState
          icon={History}
          title="Tu historial está vacío"
          description="Cuando crees meses, aparecerán aquí organizados por año."
        />
      ) : (
        <>
          <HistorySummaryCards
            monthCount={sortedMonths.length}
            totalDebts={historicalDebtTotal}
            availableTotal={historicalAvailableTotal}
          />

          <div className="history-year-list">
            {years.map((year) => {
              const months = groups.get(year) ?? []
              const headingId = `history-year-${year}`

              return (
                <section
                  key={year}
                  className="history-year-section"
                  aria-labelledby={headingId}
                >
                  <div className="history-year-heading">
                    <span className="history-year-icon" aria-hidden="true">
                      <CalendarDays className="size-5" />
                    </span>
                    <h2 id={headingId} className="history-year-title">
                      {year}
                    </h2>
                    <Badge variant="secondary" className="history-year-count">
                      {months.length} {months.length === 1 ? 'mes' : 'meses'}
                    </Badge>
                    <span className="history-year-rule" aria-hidden="true" />
                  </div>

                  <ul className="dashboard-history-list history-month-list">
                    {months.map((month) => (
                      <HistoryMonthRow
                        key={month.id}
                        month={month}
                        summary={summariesByMonth.get(month.id)!}
                        onOpen={() => setSelected(month)}
                      />
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        </>
      )}

      <MonthDetailDialog
        month={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  )
}
