'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Plus, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/features/shared/components/page-header'
import { EmptyState } from '@/features/shared/components/empty-state'
import { ConfirmDialog } from '@/features/shared/components/confirm-dialog'
import { useFinance } from '@/features/store/finance-provider'
import { monthLabel } from '@/features/shared/lib/format'
import { CreateMonthWizard } from '@/features/months/components/create-month-wizard'
import { MonthCard } from '@/features/months/components/month-card'
import type { Month } from '@/features/months/types'

export function MonthsView() {
  const { loaded, loadingError, loadingMessage, retryLoad, sortedMonths, getMonthSummary, deleteMonth, syncError, retrySync } = useFinance()
  const [pendingDelete, setPendingDelete] = React.useState<Month | null>(null)

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
            />
          ))}
        </div>
      )}

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
