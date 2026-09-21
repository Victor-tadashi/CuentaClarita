'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Plus, CalendarDays, Pencil, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const { loaded, loadingError, loadingMessage, retryLoad, sortedMonths, getMonth, getMonthDebts, getMonthSummary, deleteMonth, addDebt, updateDebt, deleteDebt, updateSalary, syncError, retrySync } = useFinance()
  const [pendingDelete, setPendingDelete] = React.useState<Month | null>(null)
  const [selectedMonthId, setSelectedMonthId] = React.useState<string | null>(null)
  const [salaryOpen, setSalaryOpen] = React.useState(false)
  const [debtOpen, setDebtOpen] = React.useState(false)
  const [editingDebt, setEditingDebt] = React.useState<Debt | null>(null)
  const [pendingDebtDelete, setPendingDebtDelete] = React.useState<Debt | null>(null)
  const selectedMonth = selectedMonthId ? getMonth(selectedMonthId) ?? null : null
  const selectedSummary = selectedMonth ? getMonthSummary(selectedMonth.id) : null
  const selectedDebts = selectedMonth ? getMonthDebts(selectedMonth.id) : []
  const openDebtForm = (debt?: Debt) => {
    setEditingDebt(debt ?? null)
    setDebtOpen(true)
  }

  if (!loaded) return <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">{loadingMessage ?? 'Cargando tus meses...'}</div>
  if (loadingError) return <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center"><p className="text-sm text-destructive">{loadingError}</p><Button variant="outline" onClick={retryLoad}>Reintentar</Button></div>

  return (
    <>
      <PageHeader
        title="Administrar Meses"
        description="Crea y gestiona tus meses. Cada mes es una fotografía independiente de tus finanzas."
        action={
          sortedMonths.length > 0 ? (
            <CreateMonthWizard
              trigger={
                <Button size="lg">
                  <Plus /> Crear Mes
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

      {sortedMonths.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Aún no has creado meses"
          description="Crea tu primer mes para empezar a registrar tu sueldo y tus deudas."
          action={
            <CreateMonthWizard
              trigger={
                <Button size="lg">
                  <Plus /> Crear mi primer mes
                </Button>
              }
            />
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedMonths.map((month) => (
            <MonthCard
              key={month.id}
              month={month}
              summary={getMonthSummary(month.id)}
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
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
          {selectedMonth && selectedSummary ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{monthLabel(selectedMonth.month, selectedMonth.year)}</DialogTitle>
                <DialogDescription>
                  {getCalendarMonthStatus(selectedMonth) === 'current' ? 'Mes activo' : getCalendarMonthStatus(selectedMonth) === 'future' ? 'Próximo' : 'Finalizado'} · Editando
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/60 bg-card/70 p-4">
                  <p className="text-xs text-muted-foreground">Sueldo</p>
                  <Amount value={selectedSummary.salary} className="mt-1 text-xl font-semibold" />
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setSalaryOpen(true)}>
                    <Pencil data-icon="inline-start" /> Editar sueldo
                  </Button>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/70 p-4">
                  <p className="text-xs text-muted-foreground">Deudas</p>
                  <Amount value={selectedSummary.totalDebts} tone="negative" className="mt-1 text-xl font-semibold" />
                  <p className="mt-2 text-xs text-muted-foreground">{selectedSummary.debtCount} deuda{selectedSummary.debtCount === 1 ? '' : 's'}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/70 p-4">
                  <p className="text-xs text-muted-foreground">Disponible</p>
                  <Amount value={selectedSummary.available} tone={selectedSummary.available < 0 ? 'negative' : 'positive'} className="mt-1 text-xl font-semibold" />
                </div>
              </div>

              <section className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">Deudas del mes</h3>
                  <Button size="sm" onClick={() => openDebtForm()}>
                    <Plus data-icon="inline-start" /> Agregar deuda
                  </Button>
                </div>
                {selectedDebts.length ? (
                  <DebtList
                    debts={selectedDebts}
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
        open={salaryOpen && selectedMonth !== null}
        onOpenChange={setSalaryOpen}
        initialSalary={selectedMonth?.salary ?? 0}
        onSave={(salary) => {
          if (selectedMonth) void updateSalary(selectedMonth.id, salary)
        }}
      />

      <DebtFormDialog
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
    </>
  )
}
