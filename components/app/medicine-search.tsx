'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { findMedicinesAction } from '@/app/actions/prescriptions'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Medicine } from '@/lib/data/types'
import { money } from '@/lib/format'
import { STOCK_LABEL, STOCK_TONE, isSellable, stockState } from '@/lib/stock'

/**
 * The drug field, shared by the prescription builder and the counter.
 *
 * Results show brand *and* generic, because the two are used interchangeably in
 * conversation and a search for "Napa" and a search for "Paracetamol" have to land
 * in the same place. Shelf state rides along on every row: prescribing something
 * the pharmacy doesn't have is a wasted trip, and selling something expired is
 * worse.
 *
 * The field clears itself after each pick so the next one can be typed straight
 * in — this is used repeatedly, not once.
 */
export function MedicineSearch({
  onPick,
  label = 'Add medicine',
  placeholder = 'Search brand or generic name',
  hint,
  blockUnsellable = false,
  autoFocus = false,
}: {
  onPick: (medicine: Medicine) => void
  label?: string
  placeholder?: string
  hint?: string
  /** The counter can't sell expired or out-of-stock items; the chamber can still
   *  prescribe them, so this is opt-in rather than always on. */
  blockUnsellable?: boolean
  autoFocus?: boolean
}) {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState<Medicine[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const inputId = useId()
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const query = term.trim()
    if (query.length < 2) {
      setResults([])
      setSearching(false)
      setOpen(false)
      return
    }

    let live = true
    setSearching(true)
    const timer = setTimeout(async () => {
      const found = await findMedicinesAction(query)
      if (!live) return
      setResults(found)
      setSearching(false)
      setOpen(true)
    }, 170)

    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [term])

  useEffect(() => {
    function onDown(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function pick(medicine: Medicine) {
    onPick(medicine)
    setTerm('')
    setResults([])
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-1.5" ref={boxRef}>
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
        <Input
          id={inputId}
          value={term}
          autoFocus={autoFocus}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => {
            // Enter takes the top result — the counter works by keyboard.
            if (e.key === 'Enter') {
              e.preventDefault()
              const first = results.find((m) => !blockUnsellable || isSellable(m))
              if (first) pick(first)
            }
            if (e.key === 'Escape') setOpen(false)
          }}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${inputId}-list`}
          className="pl-9"
        />

        {open && results.length > 0 ? (
          <ul
            id={`${inputId}-list`}
            role="listbox"
            className="glass absolute z-20 mt-1.5 max-h-80 w-full overflow-auto rounded-xl p-1.5 shadow-lift"
          >
            {results.map((m) => {
              const state = stockState(m)
              const blocked = blockUnsellable && !isSellable(m)
              return (
                <li key={m.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    disabled={blocked}
                    onClick={() => pick(m)}
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:bg-accent-soft"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {m.name} <span className="font-mono text-xs">{m.strength}</span>
                        {m.prescriptionOnly ? (
                          <span className="ml-1.5 font-mono text-[0.625rem] text-ink-faint">
                            Rx
                          </span>
                        ) : null}
                      </span>
                      <span className="block truncate text-[0.6875rem] capitalize text-ink-faint">
                        {m.generic} · {m.form} · rack {m.rack}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-mono text-xs font-medium text-ink">
                        {money(m.unitPrice)}
                      </span>
                      <span className="mt-0.5 block">
                        <Badge tone={STOCK_TONE[state]}>
                          {state === 'ok' ? `${m.stock} in stock` : STOCK_LABEL[state]}
                        </Badge>
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>

      {searching ? (
        <p className="text-xs text-ink-faint">Searching the shelf…</p>
      ) : term.trim().length >= 2 && results.length === 0 ? (
        <p className="text-xs text-ink-faint">Nothing on the shelf matches that.</p>
      ) : hint ? (
        <p className="text-xs text-ink-faint">{hint}</p>
      ) : null}
    </div>
  )
}
