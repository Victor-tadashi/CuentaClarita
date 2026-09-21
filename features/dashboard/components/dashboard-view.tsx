'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, PartyPopper, Sparkles } from 'lucide-react'
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
  const searchParams = useSearchParams()
  const selectedMonthId = searchParams.get('monthId')
  const {
    loaded,
    loadingError,
    loadingMessage,
    retryLoad,
    activeMonth,
    getMonth,
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

  const viewingMonth = selectedMonthId ? getMonth(selectedMonthId) ?? activeMonth : activeMonth

  if (!viewingMonth) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <EmptyState
          icon={Sparkles}
          title="Bienvenido a CuentaClarita"
          description="Todavía no has creado ningún mes. Crea tu primer mes para registrar tu sueldo y tus deudas."
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
      </>
    )
  }

  const debts = getMonthDebts(viewingMonth.id)
  const summary = getMonthSummary(viewingMonth.id)

  const isViewingSelectedMonth = viewingMonth.id !== activeMonth?.id

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
        await addDebt(viewingMonth.id, input)
        toast.success('Deuda agregada.')
      }
    } catch {
      // El estado persistente de error informa al usuario y permite reintentar.
    }
  }

  return (
    <>
      <PageHeader
        title={monthLabel(viewingMonth.month, viewingMonth.year)}
        description={`Hola, ${user?.name ?? 'de nuevo'}. ${isViewingSelectedMonth ? 'Estás revisando este mes.' : 'Este es tu mes activo.'}`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <span className="size-1.5 rounded-full bg-positive" />
              {isViewingSelectedMonth ? 'Mes en revisión' : 'Mes activo'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSalaryOpen(true)}
            >
              <Pencil /> Editar sueldo
            </Button>
          </div>
        }
      />

      {syncError ? (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-negative/30 bg-negative/10 p-3 text-sm text-negative" role="alert">
          <span>{syncError}</span>
          <Button variant="outline" size="sm" onClick={retrySync}>Reintentar</Button>
        </div>
      ) : null}

      <SummaryCards summary={summary} />

      <section className="dashboard-debts-section mt-10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Deudas del mes
            {debts.length > 0 ? (
              <span className="ml-1.5 text-muted-foreground/70">
                ({debts.length})
              </span>
            ) : null}
          </h2>
          <Button size="sm" onClick={openCreate}>
            <Plus /> Agregar deuda
          </Button>
        </div>

        {debts.length === 0 ? (
          <EmptyState
            icon={PartyPopper}
            title="Sin deudas registradas"
            description="Agrega tus deudas de este mes para calcular cuánto dinero te quedará disponible."
            action={
              <Button onClick={openCreate}>
                <Plus /> Agregar deuda
              </Button>
            }
          />
        ) : (
          <DebtList
            debts={debts}
            editable
            onEdit={openEdit}
            onDelete={(debt) => setPendingDelete(debt)}
          />
        )}
      </section>

      <SalaryDialog
        open={salaryOpen}
        onOpenChange={setSalaryOpen}
        initialSalary={viewingMonth.salary}
          onSave={async (salary) => {
          try {
            await updateSalary(viewingMonth.id, salary)
            toast.success('Sueldo actualizado.')
          } catch {
            // El estado persistente de error informa al usuario y permite reintentar.
          }
        }}
      />

      <DebtFormDialog
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
    </>
  )
}
