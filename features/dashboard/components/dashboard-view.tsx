'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, PartyPopper, Sparkles, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/features/shared/components/page-header'
import { EmptyState } from '@/features/shared/components/empty-state'
import { ConfirmDialog } from '@/features/shared/components/confirm-dialog'
import { useFinance } from '@/features/store/finance-provider'
import { useAuth } from '@/features/auth/auth-provider'
import { monthLabel } from '@/features/shared/lib/format'
import { CreateMonthWizard } from '@/features/months/components/create-month-wizard'
import { SalaryDialog } from '@/features/months/components/salary-dialog'
import { SummaryCards } from '@/features/dashboard/components/summary-cards'
import { DebtList } from '@/features/debts/components/debt-list'
import { DebtFormDialog } from '@/features/debts/components/debt-form-dialog'
import type { Debt, DebtInput } from '@/features/debts/types'

export function DashboardView() {
  const { user } = useAuth()
  const {
    loaded,
    loadingError,
    loadingMessage,
    retryLoad,
    activeMonth,
    getMonthDebts,
    getMonthSummary,
    updateSalary,
    addDebt,
    updateDebt,
    deleteDebt,
    syncError,
    retrySync,
  } = useFinance()

  const [salaryOpen, setSalaryOpen] = React.useState(false)
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Debt | null>(null)
  const [pendingDelete, setPendingDelete] = React.useState<Debt | null>(null)

  if (!loaded) return <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">{loadingMessage ?? 'Cargando tus finanzas...'}</div>

  if (loadingError) {
    return <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center"><p className="text-sm text-destructive">{loadingError}</p><Button variant="outline" onClick={retryLoad}>Reintentar</Button></div>
  }

  if (!activeMonth) {
    return (
      <div className="dashboard-home-view">
        <PageHeader title="Dashboard" />
        <EmptyState
          icon={Sparkles}
          title="Bienvenido a CuentaClarita"
          description="Todavía no has creado ningún mes. Crea tu primer mes para registrar tu sueldo y tus deudas."
          action={
            <CreateMonthWizard
              trigger={
                <Button size="lg" className="dashboard-home-cta">
                  <Plus data-icon="inline-start" /> Crear mi primer mes
                </Button>
              }
            />
          }
        />
      </div>
    )
  }

  const debts = getMonthDebts(activeMonth.id)
  const summary = getMonthSummary(activeMonth.id)

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (debt: Debt) => {
    setEditing(debt)
    setFormOpen(true)
  }

  const handleSubmit = async (input: DebtInput) => {
    try {
      if (editing) {
        await updateDebt(editing.id, input)
        toast.success('Deuda actualizada.')
      } else {
        await addDebt(activeMonth.id, input)
        toast.success('Deuda agregada.')
      }
    } catch {
      // El estado persistente de error informa al usuario y permite reintentar.
    }
  }

  return (
    <div className="dashboard-home-view">
      <header className="dashboard-home-header">
        <div className="dashboard-home-heading">
          <h1 className="dashboard-home-title">
            {monthLabel(activeMonth.month, activeMonth.year)}
          </h1>
          <p className="dashboard-home-greeting">
            Hola, {user?.name ?? 'de nuevo'}. Este es tu mes activo.
          </p>
        </div>
        <div className="dashboard-home-header-actions">
          <Badge variant="secondary" className="dashboard-home-status">
            <span className="dashboard-home-status-dot" aria-hidden="true" />
            Mes activo
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="dashboard-home-salary-button"
            onClick={() => setSalaryOpen(true)}
          >
            <Pencil data-icon="inline-start" />
            Editar sueldo
          </Button>
        </div>
      </header>

      {syncError ? (
        <div className="dashboard-home-sync-alert mb-4 flex items-center justify-between gap-3 rounded-lg border border-negative/30 bg-negative/10 p-3 text-sm text-negative" role="alert">
          <span>{syncError}</span>
          <Button variant="outline" size="sm" onClick={retrySync}>Reintentar</Button>
        </div>
      ) : null}

      <SummaryCards summary={summary} />

      <section className="dashboard-home-debts">
        <div className="dashboard-home-debts-header">
          <div className="dashboard-home-debts-heading">
            <span className="dashboard-home-debts-icon" aria-hidden="true">
              <ClipboardList className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="dashboard-home-debts-title">
                Deudas del mes
                <span className="dashboard-home-debt-count">({debts.length})</span>
              </h2>
              <p className="dashboard-home-debts-description">
                Aquí puedes ver y administrar todas tus deudas registradas.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="dashboard-home-cta dashboard-home-add-button"
            aria-label="Agregar deuda"
            onClick={openCreate}
          >
            <Plus data-icon="inline-start" />
            <span className="dashboard-home-add-label">Agregar deuda</span>
          </Button>
        </div>

        {debts.length === 0 ? (
          <EmptyState
            icon={PartyPopper}
            title="Sin deudas registradas"
            description="Agrega tus deudas de este mes para calcular cuánto dinero te quedará disponible."
            action={
              <Button className="dashboard-home-cta" onClick={openCreate}>
                <Plus data-icon="inline-start" /> Agregar deuda
              </Button>
            }
          />
        ) : (
          <DebtList
            debts={debts}
            appearance="dashboard"
            editable
            onEdit={openEdit}
            onDelete={(debt) => setPendingDelete(debt)}
          />
        )}
      </section>

      <SalaryDialog
        className="dashboard-home-dialog"
        open={salaryOpen}
        onOpenChange={setSalaryOpen}
        initialSalary={activeMonth.salary}
        onSave={async (salary) => {
          try {
            await updateSalary(activeMonth.id, salary)
            toast.success('Sueldo actualizado.')
          } catch {
            // El estado persistente de error informa al usuario y permite reintentar.
          }
        }}
      />

      <DebtFormDialog
        className="dashboard-home-dialog"
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={editing ? 'edit' : 'create'}
        initialValue={
          editing
            ? {
                name: editing.name,
                amount: editing.amount,
                dueDate: editing.dueDate,
                notes: editing.notes,
              }
            : null
        }
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        className="dashboard-home-dialog"
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Eliminar deuda"
        description={
          pendingDelete
            ? `¿Seguro que quieres eliminar "${pendingDelete.name}"? Esta acción no se puede deshacer.`
            : undefined
        }
        onConfirm={async () => {
          if (pendingDelete) {
            try {
              await deleteDebt(pendingDelete.id)
              toast.success('Deuda eliminada.')
            } catch {
              // El estado persistente de error informa al usuario y permite reintentar.
            }
          }
        }}
      />
    </div>
  )
}
