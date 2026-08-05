export interface Debt {
  id: string
  monthId: string
  name: string
  amount: number
  /** Fecha de vencimiento en formato ISO (YYYY-MM-DD). Opcional. */
  dueDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

/** Campos editables de una deuda. */
export interface DebtInput {
  name: string
  amount: number
  dueDate: string | null
  notes: string | null
}
