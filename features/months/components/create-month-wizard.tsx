'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Plus, Copy, Trash2, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { MoneyInput } from '@/features/shared/components/money-input'
import { Amount } from '@/features/shared/components/amount'
import {
  MONTH_NAMES,
  createId,
  monthLabel,
} from '@/features/shared/lib/format'
import { useFinance } from '@/features/store/finance-provider'
import type { DebtInput } from '@/features/debts/types'

interface DebtDraft extends DebtInput {
  key: string
  enabled: boolean
}

const STEPS = ['Periodo', 'Sueldo', 'Deudas', 'Resumen'] as const

function toDraft(debt: DebtInput): DebtDraft {
  return { ...debt, key: createId(), enabled: true }
}

export function CreateMonthWizard({ trigger }: { trigger: React.ReactNode }) {
  const { months, getLatestDebts, createMonth } = useFinance()
  const currentYear = new Date().getFullYear()

  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState(0)
  const [month, setMonth] = React.useState(new Date().getMonth() + 1)
  const [year, setYear] = React.useState(currentYear)
  const [salary, setSalary] = React.useState(0)
  const [drafts, setDrafts] = React.useState<DebtDraft[]>([])

  const reset = React.useCallback(() => {
    setStep(0)
    setMonth(new Date().getMonth() + 1)
    setYear(currentYear)
    setSalary(0)
    setDrafts(getLatestDebts().map(toDraft))
  }, [currentYear, getLatestDebts])

  const handleOpenChange = (next: boolean) => {
    if (next) reset()
    setOpen(next)
  }

  const duplicatedMonth = months.some(
    (m) => m.month === month && m.year === year,
  )
  const enabledDrafts = drafts.filter((d) => d.enabled && d.name.trim())
  const totalDebts = enabledDrafts.reduce((sum, d) => sum + (d.amount || 0), 0)
  const available = salary - totalDebts

  const years = Array.from({ length: 6 }, (_, i) => currentYear - 1 + i)

  const canContinue =
    step === 0 ? !duplicatedMonth : step === 1 ? salary > 0 : true

  const updateDraft = (key: string, patch: Partial<DebtDraft>) =>
    setDrafts((prev) =>
      prev.map((d) => (d.key === key ? { ...d, ...patch } : d)),
    )

  const removeDraft = (key: string) =>
    setDrafts((prev) => prev.filter((d) => d.key !== key))

  const duplicateDraft = (key: string) =>
    setDrafts((prev) => {
      const index = prev.findIndex((d) => d.key === key)
      if (index === -1) return prev
      const copy = { ...prev[index], key: createId() }
      const next = [...prev]
      next.splice(index + 1, 0, copy)
      return next
    })

  const addDraft = () =>
    setDrafts((prev) => [
      ...prev,
      toDraft({ name: '', amount: 0, dueDate: null, notes: null }),
    ])

  const handleCreate = () => {
    const debts: DebtInput[] = enabledDrafts.map((d) => ({
      name: d.name.trim(),
      amount: d.amount,
      dueDate: d.dueDate || null,
      notes: d.notes,
    }))
    createMonth({ month, year, salary }, debts)
    toast.success(`${monthLabel(month, year)} creado como mes activo.`)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Crear nuevo mes</DialogTitle>
          <DialogDescription>
            Paso {step + 1} de {STEPS.length}: {STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((label, index) => (
            <div
              key={label}
              className={
                'h-1 flex-1 rounded-full transition-colors ' +
                (index <= step ? 'bg-primary' : 'bg-border')
              }
            />
          ))}
        </div>

        <div className="min-h-[260px]">
          {step === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Mes</Label>
                <Select
                  value={String(month)}
                  onValueChange={(v) => setMonth(Number(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: string) => MONTH_NAMES[Number(value) - 1]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((name, index) => (
                      <SelectItem key={name} value={String(index + 1)}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Año</Label>
                <Select
                  value={String(year)}
                  onValueChange={(v) => setYear(Number(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {duplicatedMonth ? (
                <p className="text-sm text-negative sm:col-span-2" role="alert">
                  Ya existe un mes de {monthLabel(month, year)}. Elige otro
                  periodo.
                </p>
              ) : null}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid max-w-xs gap-1.5">
              <Label htmlFor="wizard-salary">Sueldo del mes</Label>
              <MoneyInput
                id="wizard-salary"
                value={salary}
                onValueChange={setSalary}
                className="h-10 text-base"
              />
              <p className="text-xs text-muted-foreground">
                Ingresa el total de ingresos que recibirás este mes.
              </p>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {drafts.length === 0
                    ? 'Sin deudas importadas. Agrega las de este mes.'
                    : 'Activa, edita o elimina las deudas de este mes.'}
                </p>
                <Button size="sm" variant="outline" onClick={addDraft}>
                  <Plus /> Agregar
                </Button>
              </div>

              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {drafts.map((draft) => (
                  <div
                    key={draft.key}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/60 p-2"
                  >
                    <Checkbox
                      checked={draft.enabled}
                      onCheckedChange={(checked) =>
                        updateDraft(draft.key, { enabled: checked === true })
                      }
                      aria-label="Incluir deuda"
                    />
                    <Input
                      placeholder="Nombre"
                      value={draft.name}
                      onChange={(e) =>
                        updateDraft(draft.key, { name: e.target.value })
                      }
                      className="h-8 min-w-32 flex-1"
                    />
                    <MoneyInput
                      value={draft.amount}
                      onValueChange={(amount) =>
                        updateDraft(draft.key, { amount })
                      }
                      className="h-8 w-28"
                    />
                    <Input
                      type="date"
                      value={draft.dueDate ?? ''}
                      onChange={(e) =>
                        updateDraft(draft.key, {
                          dueDate: e.target.value || null,
                        })
                      }
                      className="h-8 w-36"
                    />
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Duplicar deuda"
                        onClick={() => duplicateDraft(draft.key)}
                      >
                        <Copy />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Eliminar deuda"
                        className="text-muted-foreground hover:text-negative"
                        onClick={() => removeDraft(draft.key)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
                <dl className="divide-y divide-border text-sm">
                  <div className="flex items-center justify-between py-2">
                    <dt className="text-muted-foreground">Mes</dt>
                    <dd className="font-medium">{monthLabel(month, year)}</dd>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <dt className="text-muted-foreground">Sueldo</dt>
                    <dd>
                      <Amount value={salary} className="text-sm" />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <dt className="text-muted-foreground">Cantidad de deudas</dt>
                    <dd className="font-medium">{enabledDrafts.length}</dd>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <dt className="text-muted-foreground">Total de deudas</dt>
                    <dd>
                      <Amount
                        value={totalDebts}
                        tone="negative"
                        className="text-sm"
                      />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <dt className="font-medium">Disponible</dt>
                    <dd>
                      <Amount
                        value={available}
                        tone={available < 0 ? 'negative' : 'positive'}
                        className="text-base font-semibold"
                      />
                    </dd>
                  </div>
                </dl>
              </div>
              {available < 0 ? (
                <p className="text-xs text-negative">
                  Tus deudas superan tu sueldo este mes.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Controles */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => (step === 0 ? setOpen(false) : setStep(step - 1))}
          >
            {step === 0 ? 'Cancelar' : 'Atrás'}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              size="lg"
              disabled={!canContinue}
              onClick={() => setStep(step + 1)}
            >
              Continuar
            </Button>
          ) : (
            <Button size="lg" onClick={handleCreate}>
              <Check /> Crear Mes
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
