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
  loadingError: string | null
  syncError: string | null
  retryLoad: () => void
  retrySync: () => void
  months: Month[]
  activeMonth: Month | null
  /** Meses ordenados del más reciente al más antiguo. */
  sortedMonths: Month[]
  getMonth: (monthId: string) => Month | undefined
  getMonthDebts: (monthId: string) => Debt[]
  getMonthSummary: (monthId: string) => MonthSummary
  /** Deudas del mes más reciente, útiles para importarlas al crear un mes. */
  getLatestDebts: () => DebtInput[]
  createMonth: (input: NewMonthInput, debts: DebtInput[]) => Promise<Month>
  updateSalary: (monthId: string, salary: number) => Promise<void>
  deleteMonth: (monthId: string) => Promise<void>
  addDebt: (monthId: string, input: DebtInput) => Promise<void>
  updateDebt: (debtId: string, input: DebtInput) => Promise<void>
  deleteDebt: (debtId: string) => Promise<void>
}

const FinanceContext = React.createContext<FinanceContextValue | null>(null)

function compareMonthsDesc(a: Month, b: Month) {
  if (a.year !== b.year) return b.year - a.year
  return b.month - a.month
}

async function syncToSupabase(data: FinanceData, userId: string, client: ReturnType<typeof createClient>) {
  const months = data.months.map((m) => ({ id: m.id, user_id: userId, year: m.year, month: m.month, salary: m.salary, status: m.status, created_at: m.createdAt, updated_at: m.updatedAt }))
  const debts = data.debts.map((d) => ({ id: d.id, month_id: d.monthId, user_id: userId, name: d.name, amount: d.amount, due_date: d.dueDate, notes: d.notes, created_at: d.createdAt, updated_at: d.updatedAt }))

  // Upsert primero: un fallo nunca puede dejar la cuenta vacía.
  if (months.length) {
    const { error } = await client.from('months').upsert(months, { onConflict: 'id' })
    if (error) throw error
  }
  if (debts.length) {
    const { error } = await client.from('debts').upsert(debts, { onConflict: 'id' })
    if (error) throw error
  }

  // Elimina únicamente filas que el usuario borró localmente.
  const monthIds = months.map((month) => month.id)
  const debtIds = debts.map((debt) => debt.id)
  const { data: remoteMonths, error: remoteMonthsError } = await client.from('months').select('id').eq('user_id', userId)
  if (remoteMonthsError) throw remoteMonthsError
  const staleMonthIds = (remoteMonths ?? []).map((month: { id: string }) => month.id).filter((id: string) => !monthIds.includes(id))
  if (staleMonthIds.length) {
    const { error } = await client.from('months').delete().eq('user_id', userId).in('id', staleMonthIds)
    if (error) throw error
  }
  const { data: remoteDebts, error: remoteDebtsError } = await client.from('debts').select('id').eq('user_id', userId)
  if (remoteDebtsError) throw remoteDebtsError
  const staleDebtIds = (remoteDebts ?? []).map((debt: { id: string }) => debt.id).filter((id: string) => !debtIds.includes(id))
  if (staleDebtIds.length) {
    const { error } = await client.from('debts').delete().eq('user_id', userId).in('id', staleDebtIds)
    if (error) throw error
  }
}

export function FinanceProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = React.useMemo(() => typeof window === 'undefined' ? null : createClient(), [])
  const { user } = useAuth()
  const [data, setData] = React.useState<FinanceData>(EMPTY_DATA)
  const [loaded, setLoaded] = React.useState(false)
  const [remoteReady, setRemoteReady] = React.useState(false)
  const [loadingError, setLoadingError] = React.useState<string | null>(null)
  const [syncError, setSyncError] = React.useState<string | null>(null)
  const [reloadKey, setReloadKey] = React.useState(0)
  const dataRef = React.useRef(data)
  const lastSyncedData = React.useRef<FinanceData | null>(null)
  const retrySyncAction = React.useRef<(() => Promise<void>) | null>(null)

  React.useEffect(() => {
    dataRef.current = data
  }, [data])

  const persistData = React.useCallback(async (nextData: FinanceData) => {
    if (!user || !supabase) throw new Error('No hay una sesión activa.')
    try {
      await syncToSupabase(nextData, user.id, supabase)
      lastSyncedData.current = nextData
      setSyncError(null)
    } catch (error) {
      console.error('[v0] Error guardando finanzas en Supabase', error)
      setSyncError('No pudimos guardar los cambios. Revisa tu conexión e inténtalo nuevamente.')
      throw error
    }
  }, [supabase, user])

  const commitData = React.useCallback(async (nextData: FinanceData) => {
    const previousData = dataRef.current
    dataRef.current = nextData
    setData(nextData)
    try {
      await persistData(nextData)
    } catch (error) {
      dataRef.current = previousData
      setData(previousData)
      throw error
    }
  }, [persistData])

  React.useEffect(() => {
    let cancelled = false
    async function loadRemote() {
      if (!user || !supabase) { setData(EMPTY_DATA); setRemoteReady(false); setLoaded(true); return }
      const [{ data: remoteMonths, error: monthsError }, { data: remoteDebts, error: debtsError }] = await Promise.all([
        supabase.from('months').select('id, year, month, salary, status, created_at, updated_at').eq('user_id', user.id).order('year', { ascending: false }).order('month', { ascending: false }),
        supabase.from('debts').select('id, month_id, name, amount, due_date, notes, created_at, updated_at').eq('user_id', user.id).order('created_at'),
      ])
      if (cancelled) return
      if (monthsError || debtsError) {
        console.error('[v0] Error cargando finanzas desde Supabase', monthsError ?? debtsError)
        setRemoteReady(false)
        setLoadingError('No pudimos cargar tus finanzas. Revisa tu conexión e inténtalo nuevamente.')
      } else {
        setLoadingError(null)
        setRemoteReady(true)
        setData({ months: (remoteMonths ?? []).map((m: { id: string; year: number; month: number; salary: number | string; status: 'active' | 'finished'; created_at: string; updated_at: string }) => ({ id: m.id, year: m.year, month: m.month, salary: Number(m.salary), status: m.status, createdAt: m.created_at, updatedAt: m.updated_at })), debts: (remoteDebts ?? []).map((d: { id: string; month_id: string; name: string; amount: number | string; due_date: string | null; notes: string | null; created_at: string; updated_at: string }) => ({ id: d.id, monthId: d.month_id, name: d.name, amount: Number(d.amount), dueDate: d.due_date, notes: d.notes, createdAt: d.created_at, updatedAt: d.updated_at })) })
      }
      setLoaded(true)
    }
    loadRemote()
    return () => { cancelled = true }
  }, [reloadKey, supabase, user])

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

    const createMonth = async (input: NewMonthInput, debts: DebtInput[]): Promise<Month> => {
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
      if (!supabase || !user) throw new Error('No hay una sesión activa.')
      const { error } = await supabase.rpc('create_month_with_debts', {
        p_month_id: month.id,
        p_year: month.year,
        p_month: month.month,
        p_salary: month.salary,
        p_debts: newDebts.map((debt) => ({
          id: debt.id,
          name: debt.name,
          amount: debt.amount,
          due_date: debt.dueDate,
          notes: debt.notes,
          created_at: debt.createdAt,
          updated_at: debt.updatedAt,
        })),
      })
      if (error) {
        retrySyncAction.current = async () => { await createMonth(input, debts) }
        setSyncError('No pudimos crear el mes. Revisa tu conexión e inténtalo nuevamente.')
        throw error
      }
      retrySyncAction.current = null
      const nextData = {
        months: [
          ...data.months.map((m) => m.status === 'active' ? { ...m, status: 'finished' as const } : m),
          month,
        ],
        debts: [...data.debts, ...newDebts],
      }
      setData(nextData)
      setSyncError(null)
      return month
    }

    const updateSalary = async (monthId: string, salary: number) => {
      const nextData = { ...data, months: data.months.map((m) => m.id === monthId ? { ...m, salary, updatedAt: now() } : m) }
      await commitData(nextData)
    }

    const deleteMonth = async (monthId: string) => {
      if (!supabase) throw new Error('No hay una sesión activa.')
      const { error } = await supabase.rpc('delete_month_with_debts', { p_month_id: monthId })
      if (error) {
        retrySyncAction.current = async () => { await deleteMonth(monthId) }
        setSyncError('No pudimos eliminar el mes. Revisa tu conexión e inténtalo nuevamente.')
        throw error
      }
      retrySyncAction.current = null
      setData({ months: data.months.filter((m) => m.id !== monthId), debts: data.debts.filter((d) => d.monthId !== monthId) })
      setSyncError(null)
    }

    const addDebt = async (monthId: string, input: DebtInput) => {
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
      await commitData({ ...data, debts: [...data.debts, debt] })
    }

    const updateDebt = async (debtId: string, input: DebtInput) => {
      await commitData({ ...data, debts: data.debts.map((d) => d.id === debtId ? { ...d, ...input, updatedAt: now() } : d) })
    }

    const deleteDebt = async (debtId: string) => {
      await commitData({ ...data, debts: data.debts.filter((d) => d.id !== debtId) })
    }

    return {
      loaded,
      loadingError,
      syncError,
      retryLoad: () => setReloadKey((key) => key + 1),
      retrySync: () => {
        if (retrySyncAction.current) {
          void retrySyncAction.current()
        } else {
          void persistData(data)
        }
      },
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
  }, [data, loaded, loadingError, syncError, persistData, commitData, supabase, user])

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
