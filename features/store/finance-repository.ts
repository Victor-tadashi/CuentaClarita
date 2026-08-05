import type { Month } from '@/features/months/types'
import type { Debt } from '@/features/debts/types'
import { localStorageAdapter } from '@/features/shared/services/storage'
import type { KeyValueStorage } from '@/features/shared/services/storage'

/** Fotografía completa de los datos de la aplicación. */
export interface FinanceData {
  months: Month[]
  debts: Debt[]
}

export const EMPTY_DATA: FinanceData = { months: [], debts: [] }

const STORAGE_KEY = 'finmes:data:v1'

/**
 * Repositorio de persistencia de FinMes.
 *
 * Encapsula el acceso al almacenamiento. Para migrar a otra fuente de datos
 * (Supabase, PostgreSQL, etc.) basta con crear otra implementación de esta
 * interfaz y reemplazarla en el proveedor de estado.
 */
export interface FinanceRepository {
  load(): FinanceData
  save(data: FinanceData): void
}

export function createLocalFinanceRepository(
  storage: KeyValueStorage = localStorageAdapter,
): FinanceRepository {
  return {
    load() {
      const data = storage.get<FinanceData>(STORAGE_KEY, EMPTY_DATA)
      return {
        months: Array.isArray(data.months) ? data.months : [],
        debts: Array.isArray(data.debts) ? data.debts : [],
      }
    },
    save(data) {
      storage.set(STORAGE_KEY, data)
    },
  }
}
