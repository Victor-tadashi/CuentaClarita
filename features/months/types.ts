/**
 * Estado de un mes.
 * - `active`   → Mes Activo (solo puede existir uno a la vez).
 * - `finished` → Mes Finalizado (histórico, de solo lectura).
 *
 * El estado "Sin crear" es un estado puramente de interfaz para meses
 * que aún no existen y por eso no se modela en el dominio.
 */
export type MonthStatus = 'active' | 'finished'

export interface Month {
  id: string
  /** Número de mes, 1 (Enero) a 12 (Diciembre). */
  month: number
  year: number
  salary: number
  status: MonthStatus
  createdAt: string
  updatedAt: string
}

/** Datos necesarios para crear un nuevo mes. */
export interface NewMonthInput {
  month: number
  year: number
  salary: number
}
