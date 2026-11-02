'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  CalendarDays,
  CircleCheck,
  CircleDot,
  Pencil,
  PiggyBank,
  Plus,
  Receipt,
  WalletCards,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/features/shared/components/page-header'
import { EmptyState } from '@/features/shared/components/empty-state'
import { ConfirmDialog } from '@/features/shared/components/confirm-dialog'
import { getCalendarMonthStatus, useFinance } from '@/features/store/finance-provider'
import { monthLabel } from '@/features/shared/lib/format'
import { CreateMonthWizard } from '@/features/months/components/create-month-wizard'
import { MonthCard } from '@/features/months/components/month-card'
import type { Month } from '@/features/months/types'
import type { Debt } from '@/features/debts/types'
import { DebtList } from '@/features/debts/components/debt-list'
import { DebtFormDialog } from '@/features/debts/components/debt-form-dialog'
import { SalaryDialog } from '@/features/months/components/salary-dialog'
import { Amount } from '@/features/shared/components/amount'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function MonthsView() {
  const {
    loaded,
    loadingError,
    loadingMessage,
    retryLoad,
    activeMonth,
    sortedMonths,
    getMonth,
    getMonthDebts,
    getMonthSummary,
    deleteMonth,
    addDebt,
    updateDebt,
    deleteDebt,
    updateSalary,
    syncError,
    retrySync,
  } = useFinance()
  const [pendingDelete, setPendingDelete] = React.useState<Month | null>(null)
  const [selectedMonthId, setSelectedMonthId] = React.useState<string | null>(null)
  const [salaryOpen, setSalaryOpen] = React.useState(false)
  const [debtOpen, setDebtOpen] = React.useState(false)
  const [editingDebt, setEditingDebt] = React.useState<Debt | null>(null)
  const [pendingDebtDelete, setPendingDebtDelete] = React.useState<Debt | null>(null)
  const selectedMonth = selectedMonthId ? getMonth(selectedMonthId) ?? null : null
  const selectedSummary = selectedMonth ? getMonthSummary(selectedMonth.id) : null
  const selectedDebts = selectedMonth ? getMonthDebts(selectedMonth.id) : []
  const selectedMonthStatus = selectedMonth
    ? selectedMonth.id === activeMonth?.id
      ? 'Mes activo'
      : getCalendarMonthStatus(selectedMonth) === 'future'
        ? 'Próximo'
        : 'Finalizado'
    : null
  const finishedMonthCount = sortedMonths.filter(
    (month) =>
      month.id !== activeMonth?.id &&
      getCalendarMonthStatus(month) === 'finished',
  ).length

  const openDebtForm = (debt?: Debt) => {
    setEditingDebt(debt ?? null)
    setDebtOpen(true)
  }

  if (!loaded) {
    return (
      <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
        {loadingMessage ?? 'Cargando tus meses...'}
      </div>
    )
  }

  if (loadingError) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-destructive">{loadingError}</p>
        <Button variant="outline" onClick={retryLoad}>Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="months-view">
      <PageHeader
        icon={CalendarDays}
        title="Administrar Meses"
        description="Crea y gestiona tus meses. Cada mes es una fotografía independiente de tus finanzas."
        action={
          sortedMonths.length > 0 ? (
            <CreateMonthWizard
              trigger={
                <Button size="lg" className="dashboard-home-cta h-11 w-full rounded-xl px-4 sm:w-auto">
                  <Plus data-icon="inline-start" /> Crear Mes
                </Button>
              }
            />
          ) : undefined
        }
      />

      {syncError ? (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-negative/30 bg-negative/10 p-3 text-sm text-negative" role="alert">
          <span>{syncError}</span>
          <Button variant="outline" size="sm" onClick={retrySync}>Reintentar</Button>
        </div>
      ) : null}

      <section className="months-summary-grid" aria-label="Resumen de meses">
        <article className="months-summary-card">
          <span className="months-summary-icon" aria-hidden="true">
            <CalendarDays className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="months-summary-label">Total de meses</p>
            <p className="months-summary-value">{sortedMonths.length}</p>
          </div>
        </article>
        <article className="months-summary-card">
          <span className="months-summary-icon" aria-hidden="true">
            <CircleDot className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="months-summary-label">Mes activo</p>
            <p className="months-summary-value">
              {activeMonth
                ? monthLabel(activeMonth.month, activeMonth.year)
                : 'Sin mes activo'}
            </p>
          </div>
        </article>
        <article className="months-summary-card">
          <span className="months-summary-icon" aria-hidden="true">
            <CircleCheck className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="months-summary-label">Meses finalizados</p>
            <p className="months-summary-value">{finishedMonthCount}</p>
          </div>
        </article>
      </section>

      {sortedMonths.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Aún no has creado meses"
          description="Crea tu primer mes para empezar a registrar tu sueldo y tus deudas."
          action={
            <CreateMonthWizard
              trigger={
                <Button size="lg" className="dashboard-home-cta rounded-xl px-4">
                  <Plus data-icon="inline-start" /> Crear mi primer mes
                </Button>
              }
            />
          }
        />
      ) : (
        <div className="months-card-grid">
          {sortedMonths.map((month) => (
            <MonthCard
              key={month.id}
              month={month}
              summary={getMonthSummary(month.id)}
              isActive={activeMonth?.id === month.id}
              onDelete={() => setPendingDelete(month)}
              onOpen={() => setSelectedMonthId(month.id)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={selectedMonth !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMonthId(null)
            setSalaryOpen(false)
            setDebtOpen(false)
          }
        }}
      >
        <DialogContent className="months-editor-dialog max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1rem)] overflow-x-hidden overflow-y-auto p-4 sm:max-w-5xl sm:p-6">
          {selectedMonth && selectedSummary ? (
            <>
              <DialogHeader className="months-editor-header">
                <span className="months-editor-title-icon" aria-hidden="true">
                  <Pencil className="size-5" />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="text-xl">Editar mes</DialogTitle>
                  <DialogDescription className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-2">
                    Estás editando:
                    <span className="font-semibold text-foreground">
                      {monthLabel(selectedMonth.month, selectedMonth.year)}
                    </span>
                    {selectedMonthStatus ? (
                      <Badge
                        variant={selectedMonthStatus === 'Mes activo' ? 'default' : 'secondary'}
                        className="month-card-badge"
                      >
                        {selectedMonthStatus}
                      </Badge>
                    ) : null}
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="grid gap-3 sm:grid-cols-3">
                <article className="months-editor-summary-card">
                  <div className="flex items-center gap-3">
                    <span className="months-editor-summary-icon" aria-hidden="true">
                      <WalletCards className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Sueldo</p>
                      <Amount value={selectedSummary.salary} className="mt-1 text-xl font-semibold" />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="months-editor-secondary-button mt-3 h-9 rounded-lg px-3"
                    onClick={() => setSalaryOpen(true)}
                  >
                    <Pencil data-icon="inline-start" /> Editar sueldo
                  </Button>
                </article>
                <article className="months-editor-summary-card">
                  <div className="flex items-center gap-3">
                    <span className="months-editor-summary-icon" aria-hidden="true">
                      <Receipt className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Total de deudas</p>
                      <Amount value={selectedSummary.totalDebts} tone="negative" className="mt-1 text-xl font-semibold" />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {selectedSummary.debtCount} deuda{selectedSummary.debtCount === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                </article>
                <article className="months-editor-summary-card">
                  <div className="flex items-center gap-3">
                    <span className="months-editor-summary-icon" aria-hidden="true">
                      <PiggyBank className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Disponible</p>
                      <Amount
                        value={selectedSummary.available}
                        tone={selectedSummary.available < 0 ? 'negative' : 'positive'}
                        className="mt-1 text-xl font-semibold"
                      />
                    </div>
                  </div>
                </article>
              </div>

              <section className="months-editor-debts">
                <div className="months-editor-debts-header">
                  <div className="min-w-0">
                    <h3 className="font-semibold">
                      Deudas del mes <span className="text-muted-foreground">({selectedSummary.debtCount})</span>
                    </h3>
                  </div>
                  <Button
                    size="sm"
                    className="dashboard-home-cta h-10 rounded-xl px-3 sm:h-9"
                    onClick={() => openDebtForm()}
                  >
                    <Plus data-icon="inline-start" /> Agregar deuda
                  </Button>
                </div>
                {selectedDebts.length ? (
                  <DebtList
                    debts={selectedDebts}
                    appearance="dashboard"
                    editable
                    onEdit={openDebtForm}
                    onDelete={setPendingDebtDelete}
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                    Este mes todavía no tiene deudas.
                  </div>
                )}
              </section>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <SalaryDialog
        className="dashboard-home-dialog"
        open={salaryOpen && selectedMonth !== null}
        onOpenChange={setSalaryOpen}
        initialSalary={selectedMonth?.salary ?? 0}
        onSave={(salary) => {
          if (selectedMonth) void updateSalary(selectedMonth.id, salary)
        }}
      />

      <DebtFormDialog
        className="dashboard-home-dialog"
        open={debtOpen}
        onOpenChange={setDebtOpen}
        initialValue={editingDebt ? { name: editingDebt.name, amount: editingDebt.amount, dueDate: editingDebt.dueDate, notes: editingDebt.notes } : null}
        mode={editingDebt ? 'edit' : 'create'}
        onSubmit={(input) => {
          if (!selectedMonth) return
          if (editingDebt) void updateDebt(editingDebt.id, input)
          else void addDebt(selectedMonth.id, input)
        }}
      />

      <ConfirmDialog
        open={pendingDebtDelete !== null}
        onOpenChange={(open) => !open && setPendingDebtDelete(null)}
        title="Eliminar deuda"
        description={pendingDebtDelete ? `¿Seguro que quieres eliminar ${pendingDebtDelete.name}?` : undefined}
        onConfirm={async () => {
          if (pendingDebtDelete) {
            await deleteDebt(pendingDebtDelete.id)
            setPendingDebtDelete(null)
            toast.success('Deuda eliminada.')
          }
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Eliminar mes"
        description={
          pendingDelete
            ? `¿Seguro que quieres eliminar ${monthLabel(pendingDelete.month, pendingDelete.year)} y todas sus deudas? Esta acción no se puede deshacer.`
            : undefined
        }
        onConfirm={async () => {
          if (pendingDelete) {
            try {
              await deleteMonth(pendingDelete.id)
              toast.success('Mes eliminado.')
            } catch {
              // El estado persistente de error informa al usuario y permite reintentar.
            }
          }
        }}
      />
    </div>
  )
}
