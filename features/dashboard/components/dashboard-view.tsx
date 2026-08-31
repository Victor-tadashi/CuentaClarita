'use client'

import * as React from 'react'
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
  const {
    loaded,
    activeMonth,
    getMonthDebts,
    getMonthSummary,
    updateSalary,
    addDebt,
    updateDebt,
    deleteDebt,
  } = useFinance()

  const [salaryOpen, setSalaryOpen] = React.useState(false)
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Debt | null>(null)
  const [pendingDelete, setPendingDelete] = React.useState<Debt | null>(null)

  if (!loaded) return null

  if (!activeMonth) {
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

  const handleSubmit = (input: DebtInput) => {
    if (editing) {
      updateDebt(editing.id, input)
      toast.success('Deuda actualizada.')
    } else {
      addDebt(activeMonth.id, input)
      toast.success('Deuda agregada.')
    }
  }

  return (
    <>
      <PageHeader
        title={monthLabel(activeMonth.month, activeMonth.year)}
        description={`Hola, ${user?.name ?? 'de nuevo'}. Este es tu mes activo.`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <span className="size-1.5 rounded-full bg-positive" />
              Mes activo
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

      <SummaryCards summary={summary} />

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
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
        initialSalary={activeMonth.salary}
        onSave={(salary) => {
          updateSalary(activeMonth.id, salary)
          toast.success('Sueldo actualizado.')
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
        onConfirm={() => {
          if (pendingDelete) {
            deleteDebt(pendingDelete.id)
            toast.success('Deuda eliminada.')
          }
        }}
      />
    </>
  )
}
