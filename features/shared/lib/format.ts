export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

/** Formatea un monto como moneda (ej: $950.000). */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(Math.round(value || 0))
}

/** Devuelve el nombre del mes (1-12). */
export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? ''
}

/** Etiqueta legible de un mes: "Septiembre 2026". */
export function monthLabel(month: number, year: number): string {
  return `${monthName(month)} ${year}`
}

/** Formatea una fecha ISO (YYYY-MM-DD) como "12 sep". */
export function formatDueDate(iso: string | null): string | null {
  if (!iso) return null
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(year, month - 1, day))
}

/** Genera un identificador único. */
export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
