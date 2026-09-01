'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/features/auth/auth-provider'
import type { Month, NewMonthInput } from '@/features/months/types'
import type { Debt, DebtInput } from '@/features/debts/types'
import { createId } from '@/features/shared/lib/format'
import { EMPTY_DATA, type FinanceData } from '@/features/store/finance-repository'

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

async function syncToSupabase(data: FinanceData, userId: string, client: ReturnType<typeof createClient>) {
  const months = data.months.map((m) => ({ id: m.id, user_id: userId, year: m.year, month: m.month, salary: m.salary, status: m.status, created_at: m.createdAt, updated_at: m.updatedAt }))
  const debts = data.debts.map((d) => ({ id: d.id, month_id: d.monthId, user_id: userId, name: d.name, amount: d.amount, due_date: d.dueDate, notes: d.notes, created_at: d.createdAt, updated_at: d.updatedAt }))
  await client.from('debts').delete().eq('user_id', userId)
  await client.from('months').delete().eq('user_id', userId)
  if (months.length) await client.from('months').insert(months)
  if (debts.length) await client.from('debts').insert(debts)
}

export function FinanceProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = React.useMemo(() => createClient(), [])
  const { user } = useAuth()
  const [data, setData] = React.useState<FinanceData>(EMPTY_DATA)
  const [loaded, setLoaded] = React.useState(false)
  const [remoteReady, setRemoteReady] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    async function loadRemote() {
      if (!user) { setData(EMPTY_DATA); setRemoteReady(false); setLoaded(true); return }
      const [{ data: remoteMonths, error: monthsError }, { data: remoteDebts, error: debtsError }] = await Promise.all([
        supabase.from('months').select('id, year, month, salary, status, created_at, updated_at').eq('user_id', user.id).order('year', { ascending: false }).order('month', { ascending: false }),
        supabase.from('debts').select('id, month_id, name, amount, due_date, notes, created_at, updated_at').eq('user_id', user.id).order('created_at'),
      ])
      if (cancelled) return
      if (monthsError || debtsError) {
        console.error('[v0] Error cargando finanzas desde Supabase', monthsError ?? debtsError)
        setRemoteReady(false)
      } else {
        setRemoteReady(true)
        setData({ months: (remoteMonths ?? []).map((m: { id: string; year: number; month: number; salary: number | string; status: 'active' | 'finished'; created_at: string; updated_at: string }) => ({ id: m.id, year: m.year, month: m.month, salary: Number(m.salary), status: m.status, createdAt: m.created_at, updatedAt: m.updated_at })), debts: (remoteDebts ?? []).map((d: { id: string; month_id: string; name: string; amount: number | string; due_date: string | null; notes: string | null; created_at: string; updated_at: string }) => ({ id: d.id, monthId: d.month_id, name: d.name, amount: Number(d.amount), dueDate: d.due_date, notes: d.notes, createdAt: d.created_at, updatedAt: d.updated_at })) })
      }
      setLoaded(true)
    }
    loadRemote()
    return () => { cancelled = true }
  }, [supabase, user])

  React.useEffect(() => {
    if (!loaded || !remoteReady || !user) return
    void syncToSupabase(data, user.id, supabase).catch((error) => {
      console.error('[v0] Error guardando finanzas en Supabase', error)
    })
  }, [data, loaded, supabase, user])

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
