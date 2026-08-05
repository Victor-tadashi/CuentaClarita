'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const groupFormatter = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 0,
})

function format(value: number): string {
  if (!value) return ''
  return groupFormatter.format(value)
}

/** Input de moneda: muestra separadores de miles y reporta un número. */
export function MoneyInput({
  value,
  onValueChange,
  className,
  ...props
}: {
  value: number
  onValueChange: (value: number) => void
} & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        $
      </span>
      <Input
        inputMode="numeric"
        value={format(value)}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '')
          onValueChange(digits ? Number.parseInt(digits, 10) : 0)
        }}
        className={cn('pl-6 font-mono tabular-nums', className)}
        {...props}
      />
    </div>
  )
}
