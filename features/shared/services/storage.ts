/**
 * Adaptador de almacenamiento clave-valor.
 *
 * Toda la persistencia pasa por esta interfaz para que en el futuro se
 * pueda reemplazar Local Storage por Supabase, PostgreSQL o una API remota
 * sin tocar la lógica de dominio ni la interfaz.
 */
export interface KeyValueStorage {
  get<T>(key: string, fallback: T): T
  set<T>(key: string, value: T): void
  remove(key: string): void
}

/** Implementación basada en window.localStorage (segura para SSR). */
export const localStorageAdapter: KeyValueStorage = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback
    try {
      const raw = window.localStorage.getItem(key)
      if (raw == null) return fallback
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  },
  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* almacenamiento no disponible: se ignora silenciosamente */
    }
  },
  remove(key: string): void {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* noop */
    }
  },
}
