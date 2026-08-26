'use client'

import { Banknote, CreditCard, Smartphone } from 'lucide-react'
import type { PaymentMethod } from '@/lib/data/types'
import { cn } from '@/lib/utils'

/**
 * How the patient is paying, asked the same way at the counter and at the desk.
 *
 * Three buttons rather than a dropdown: it's three options that never grow, and
 * the desk shouldn't have to open a menu to say "cash". Mobile banking is labelled
 * with the two wallets people actually name at the window.
 */
export const PAYMENT_METHODS: Array<{
  value: PaymentMethod
  label: string
  icon: typeof Banknote
}> = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'mobile', label: 'bKash / Nagad', icon: Smartphone },
]

export function MethodPicker({
  value,
  onChange,
  className,
}: {
  value: PaymentMethod
  onChange: (method: PaymentMethod) => void
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Payment method"
      className={cn('grid grid-cols-3 gap-1.5', className)}
    >
      {PAYMENT_METHODS.map((m) => {
        const active = value === m.value
        const Icon = m.icon
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(m.value)}
            className={cn(
              'flex cursor-pointer flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-[0.6875rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25',
              active
                ? 'border-accent bg-accent font-medium text-accent-ink'
                : 'border-line bg-surface-solid/40 text-ink-soft hover:border-line-strong hover:text-ink',
            )}
          >
            <Icon className="size-4" />
            {m.label}
          </button>
        )
      })}
    </div>
  )
}

/** The note under the button, so nobody wonders whether the machine was run. */
export function methodHint(method: PaymentMethod): string {
  if (method === 'card') return 'Run the card on the terminal, then record it here.'
  if (method === 'mobile') return 'Confirm the transaction ID on the merchant app, then record it here.'
  return 'Count the cash before recording it.'
}
