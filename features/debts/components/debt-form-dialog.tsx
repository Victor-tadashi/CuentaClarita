'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/features/shared/components/money-input'
import type { DebtInput } from '@/features/debts/types'

const EMPTY: DebtInput = { name: '', amount: 0, dueDate: null, notes: null }

export function DebtFormDialog({
  open,
  onOpenChange,
  initialValue,
  onSubmit,
  mode,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValue?: DebtInput | null
  onSubmit: (value: DebtInput) => void
  mode: 'create' | 'edit'
}) {
  const [value, setValue] = React.useState<DebtInput>(EMPTY)
  const [error, setError] = React.useState<string | null>(null)

  // Reinicia el formulario cada vez que se abre.
  React.useEffect(() => {
    if (open) {
      setValue(initialValue ?? EMPTY)
      setError(null)
    }
  }, [open, initialValue])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.name.trim()) {
      setError('Ingresa un nombre para la deuda.')
      return
    }
    if (value.amount <= 0) {
      setError('El monto debe ser mayor a cero.')
      return
    }
    onSubmit({
      name: value.name.trim(),
      amount: value.amount,
      dueDate: value.dueDate || null,
      notes: value.notes?.trim() ? value.notes.trim() : null,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Agregar deuda' : 'Editar deuda'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Registra una deuda para este mes.'
              : 'Modifica los datos de esta deuda.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="debt-name">Nombre</Label>
            <Input
              id="debt-name"
              autoFocus
              placeholder="Ej: Arriendo, Tarjeta de crédito…"
              value={value.name}
              onChange={(e) =>
                setValue((v) => ({ ...v, name: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="debt-amount">Monto</Label>
              <MoneyInput
                id="debt-amount"
                value={value.amount}
                onValueChange={(amount) => setValue((v) => ({ ...v, amount }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="debt-date">Fecha de vencimiento</Label>
              <Input
                id="debt-date"
                type="date"
                value={value.dueDate ?? ''}
                onChange={(e) =>
                  setValue((v) => ({ ...v, dueDate: e.target.value || null }))
                }
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="debt-notes">Notas (opcional)</Label>
            <textarea
              id="debt-notes"
              rows={2}
              placeholder="Detalle adicional…"
              value={value.notes ?? ''}
              onChange={(e) =>
                setValue((v) => ({ ...v, notes: e.target.value }))
              }
              className="w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>

          {error ? (
            <p className="text-sm text-negative" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" size="lg">
              {mode === 'create' ? 'Agregar' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
