'use client'

import * as React from 'react'
import type { Month, NewMonthInput } from '@/features/months/types'
import type { Debt, DebtInput } from '@/features/debts/types'
import { createId } from '@/features/shared/lib/format'
import {
  createLocalFinanceRepository,
  EMPTY_DATA,
  type FinanceData,
  type FinanceRepository,
} from '@/features/store/finance-repository'

export interface MonthSummary {
  salary: number
  totalDebts: number
  available: number
  debtCount: number
}

interface FinanceContextValue {
  loaded: boolean
  months: Month[]
  activeMonth: Month | null
  /** Meses ordenados del más reciente al más antiguo. */
  sortedMonths: Month[]
  getMonth: (monthId: string) => Month | undefined
  getMonthDebts: (monthId: string) => Debt[]
  getMonthSummary: (monthId: string) => MonthSummary
  /** Deudas del mes más reciente, útiles para importarlas al crear un mes. */
  getLatestDebts: () => DebtInput[]
  createMonth: (input: NewMonthInput, debts: DebtInput[]) => Month
  updateSalary: (monthId: string, salary: number) => void
  deleteMonth: (monthId: string) => void
  addDebt: (monthId: string, input: DebtInput) => void
  updateDebt: (debtId: string, input: DebtInput) => void
  deleteDebt: (debtId: string) => void
}

const FinanceContext = React.createContext<FinanceContextValue | null>(null)

function compareMonthsDesc(a: Month, b: Month) {
  if (a.year !== b.year) return b.year - a.year
  return b.month - a.month
}

export function FinanceProvider({
  children,
  repository,
}: {
  children: React.ReactNode
  repository?: FinanceRepository
}) {
  const repoRef = React.useRef<FinanceRepository>(
    repository ?? createLocalFinanceRepository(),
  )
  const [data, setData] = React.useState<FinanceData>(EMPTY_DATA)
  const [loaded, setLoaded] = React.useState(false)

  // Cargar una sola vez en el cliente.
  React.useEffect(() => {
    setData(repoRef.current.load())
    setLoaded(true)
  }, [])

  // Persistir en cada cambio (una vez cargado).
  React.useEffect(() => {
    if (loaded) repoRef.current.save(data)
  }, [data, loaded])

  const value = React.useMemo<FinanceContextValue>(() => {
    const sortedMonths = [...data.months].sort(compareMonthsDesc)
    const activeMonth =
      data.months.find((m) => m.status === 'active') ?? null

    const getMonth = (monthId: string) =>
      data.months.find((m) => m.id === monthId)

    const getMonthDebts = (monthId: string) =>
      data.debts
        .filter((d) => d.monthId === monthId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    const getMonthSummary = (monthId: string): MonthSummary => {
      const month = getMonth(monthId)
      const debts = getMonthDebts(monthId)
      const salary = month?.salary ?? 0
      const totalDebts = debts.reduce((sum, d) => sum + (d.amount || 0), 0)
      return {
        salary,
        totalDebts,
        available: salary - totalDebts,
        debtCount: debts.length,
      }
    }

    const getLatestDebts = (): DebtInput[] => {
      const latest = sortedMonths[0]
      if (!latest) return []
      return getMonthDebts(latest.id).map((d) => ({
        name: d.name,
        amount: d.amount,
        dueDate: d.dueDate,
        notes: d.notes,
      }))
    }

    const now = () => new Date().toISOString()

    const createMonth = (input: NewMonthInput, debts: DebtInput[]): Month => {
      const timestamp = now()
      const month: Month = {
        id: createId(),
        month: input.month,
        year: input.year,
        salary: input.salary,
        status: 'active',
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      const newDebts: Debt[] = debts.map((d, index) => ({
        id: createId(),
        monthId: month.id,
        name: d.name,
        amount: d.amount,
        dueDate: d.dueDate,
        notes: d.notes,
        // Se desfasa el timestamp para preservar el orden de ingreso.
        createdAt: new Date(Date.now() + index).toISOString(),
        updatedAt: timestamp,
      }))
      setData((prev) => ({
        // El nuevo mes pasa a ser el activo; el resto queda finalizado.
        // Nunca se modifican los datos (sueldo/deudas) de meses anteriores.
        months: [
          ...prev.months.map((m) =>
            m.status === 'active' ? { ...m, status: 'finished' as const } : m,
          ),
          month,
        ],
        debts: [...prev.debts, ...newDebts],
      }))
      return month
    }

    const updateSalary = (monthId: string, salary: number) => {
      setData((prev) => ({
        ...prev,
        months: prev.months.map((m) =>
          m.id === monthId ? { ...m, salary, updatedAt: now() } : m,
        ),
      }))
    }

    const deleteMonth = (monthId: string) => {
      setData((prev) => ({
        months: prev.months.filter((m) => m.id !== monthId),
        debts: prev.debts.filter((d) => d.monthId !== monthId),
      }))
    }

    const addDebt = (monthId: string, input: DebtInput) => {
      const timestamp = now()
      const debt: Debt = {
        id: createId(),
        monthId,
        name: input.name,
        amount: input.amount,
        dueDate: input.dueDate,
        notes: input.notes,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      setData((prev) => ({ ...prev, debts: [...prev.debts, debt] }))
    }

    const updateDebt = (debtId: string, input: DebtInput) => {
      setData((prev) => ({
        ...prev,
        debts: prev.debts.map((d) =>
          d.id === debtId ? { ...d, ...input, updatedAt: now() } : d,
        ),
      }))
    }

    const deleteDebt = (debtId: string) => {
      setData((prev) => ({
        ...prev,
        debts: prev.debts.filter((d) => d.id !== debtId),
      }))
    }

    return {
      loaded,
      months: data.months,
      activeMonth,
      sortedMonths,
      getMonth,
      getMonthDebts,
      getMonthSummary,
      getLatestDebts,
      createMonth,
      updateSalary,
      deleteMonth,
      addDebt,
      updateDebt,
      deleteDebt,
    }
  }, [data, loaded])

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  )
}

export function useFinance(): FinanceContextValue {
  const ctx = React.useContext(FinanceContext)
  if (!ctx) {
    throw new Error('useFinance debe usarse dentro de <FinanceProvider>')
  }
  return ctx
}
