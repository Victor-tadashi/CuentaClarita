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
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/features/shared/components/money-input'

export function SalaryDialog({
  open,
  onOpenChange,
  initialSalary,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSalary: number
  onSave: (salary: number) => void
}) {
  const [salary, setSalary] = React.useState(initialSalary)

  React.useEffect(() => {
    if (open) setSalary(initialSalary)
  }, [open, initialSalary])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar sueldo</DialogTitle>
          <DialogDescription>
            Actualiza el sueldo del mes activo.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSave(salary)
            onOpenChange(false)
          }}
        >
          <div className="grid max-w-xs gap-1.5">
            <Label htmlFor="edit-salary">Sueldo</Label>
            <MoneyInput
              id="edit-salary"
              value={salary}
              onValueChange={setSalary}
              className="h-10 text-base"
              autoFocus
            />
          </div>
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
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
