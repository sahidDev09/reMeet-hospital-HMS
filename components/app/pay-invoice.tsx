'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, CheckCircle2, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { payInvoiceAction } from '@/app/actions/billing'
import { MethodPicker, methodHint } from '@/components/app/method-picker'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PaymentMethod } from '@/lib/data/types'
import { money } from '@/lib/format'

/**
 * Taking money against an invoice.
 *
 * The amount starts at the full balance because that's what happens most of the
 * time; half is one tap away because that's what happens the rest of the time.
 * After a payment the page refreshes rather than the panel patching itself — the
 * status badge, the paid line and the sheet all have to move together, and the
 * server already knows the new numbers.
 */
export function PayInvoice({
  invoiceId,
  code,
  balance,
}: {
  invoiceId: string
  code: string
  balance: number
}) {
  const [amount, setAmount] = useState(String(balance))
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const router = useRouter()

  if (balance === 0) {
    return (
      <Card className="flex items-start gap-3 p-5">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-vital-ok" strokeWidth={2.5} />
        <div>
          <p className="text-sm font-medium text-ink">Settled in full</p>
          <p className="text-xs text-ink-soft">
            Nothing outstanding on {code}. Print the invoice for the patient&rsquo;s file.
          </p>
        </div>
      </Card>
    )
  }

  function submit() {
    setError(null)
    start(async () => {
      const result = await payInvoiceAction(invoiceId, Number(amount), method)
      if (!result.ok) {
        setError(result.error ?? 'That payment did not go through.')
        return
      }
      toast.success(
        result.balance === 0
          ? `${code} settled.`
          : `${money(result.paid ?? 0)} recorded. ${money(result.balance ?? 0)} still owed.`,
      )
      router.refresh()
    })
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <p className="eyebrow text-ink-faint">Outstanding</p>
        <p className="font-display text-2xl font-semibold tracking-tight tabular text-ink">
          {money(balance)}
        </p>
      </div>

      <div className="border-t border-line pt-4">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="amount">Amount taken</Label>
          <Input
            id="amount"
            type="number"
            min={1}
            max={balance}
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-28 text-right"
          />
        </div>
        <div className="mt-2 flex gap-1.5">
          <button
            type="button"
            onClick={() => setAmount(String(balance))}
            className="cursor-pointer rounded-md border border-line px-2 py-1 text-[0.6875rem] text-ink-soft transition-colors hover:border-accent hover:text-accent"
          >
            Full balance
          </button>
          <button
            type="button"
            onClick={() => setAmount(String(Math.round(balance / 2)))}
            className="cursor-pointer rounded-md border border-line px-2 py-1 text-[0.6875rem] text-ink-soft transition-colors hover:border-accent hover:text-accent"
          >
            Half now
          </button>
        </div>
      </div>

      <div className="border-t border-line pt-4">
        <Label className="mb-2 block">Payment</Label>
        <MethodPicker value={method} onChange={setMethod} />
        <p className="mt-2 text-xs text-ink-faint">{methodHint(method)}</p>
      </div>

      {error ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-vital-crit/30 bg-vital-crit/[0.06] px-3.5 py-2.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-vital-crit" strokeWidth={2.5} />
          <p className="text-sm text-ink">{error}</p>
        </div>
      ) : null}

      <Button type="button" size="lg" disabled={pending} onClick={submit}>
        <Wallet className="size-4" />
        {pending ? 'Recording…' : `Take ${money(Number(amount) || 0)}`}
      </Button>
    </Card>
  )
}
