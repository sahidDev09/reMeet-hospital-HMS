import { Badge } from '@/components/ui/badge'
import { STOCK_LABEL, STOCK_TONE } from '@/lib/stock'
import type { AppointmentStatus, Medicine, PaymentStatus } from '@/lib/data/types'
import { stockState } from '@/lib/stock'

/**
 * Status colour, decided once.
 *
 * Every screen that shows a state reads its tone from here, so green never means
 * "cancelled" on one page and "paid" on another. In a clinical system the colour
 * is doing real work — someone scanning a list of thirty rows is reading the
 * colour before they read the word.
 */

const APPOINTMENT: Record<AppointmentStatus, { label: string; tone: 'neutral' | 'accent' | 'ok' | 'warn' | 'crit' }> = {
  scheduled: { label: 'Scheduled', tone: 'neutral' },
  'checked-in': { label: 'Checked in', tone: 'warn' },
  'in-consult': { label: 'In consult', tone: 'accent' },
  completed: { label: 'Completed', tone: 'ok' },
  cancelled: { label: 'Cancelled', tone: 'crit' },
  'no-show': { label: 'No show', tone: 'crit' },
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const { label, tone } = APPOINTMENT[status]
  return (
    <Badge tone={tone} dot={status === 'in-consult'}>
      {label}
    </Badge>
  )
}

const PAYMENT: Record<PaymentStatus, { label: string; tone: 'neutral' | 'ok' | 'warn' | 'crit' }> = {
  paid: { label: 'Paid', tone: 'ok' },
  partial: { label: 'Part paid', tone: 'warn' },
  unpaid: { label: 'Unpaid', tone: 'crit' },
  refunded: { label: 'Refunded', tone: 'neutral' },
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, tone } = PAYMENT[status]
  return <Badge tone={tone}>{label}</Badge>
}

export function StockBadge({ medicine }: { medicine: Medicine }) {
  const state = stockState(medicine)
  return <Badge tone={STOCK_TONE[state]}>{STOCK_LABEL[state]}</Badge>
}
