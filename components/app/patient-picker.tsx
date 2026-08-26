'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { findPatientsAction } from '@/app/actions/appointments'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Patient } from '@/lib/data/types'
import { age, initials } from '@/lib/format'

/**
 * Choosing a patient.
 *
 * Search by name, MRN or phone — the three things the person at the desk has in
 * front of them. Once someone is chosen the box collapses into a card showing
 * age, blood group and allergies, because every flow that picks a patient
 * (booking, prescribing, selling) is a flow where picking the wrong one matters.
 *
 * The chosen id travels in a hidden input, so this drops into any plain form.
 */
export function PatientPicker({
  name = 'patientId',
  initial,
  error,
  label = 'Patient',
  onChange,
}: {
  name?: string
  initial?: Patient | null
  error?: string
  label?: string
  /** Lets a parent react to the choice — the prescription builder uses it to
   *  cross-check allergies, the POS to price against a record. */
  onChange?: (patient: Patient | null) => void
}) {
  const [chosen, setChosen] = useState<Patient | null>(initial ?? null)
  const [term, setTerm] = useState('')
  const [results, setResults] = useState<Patient[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const inputId = useId()
  const boxRef = useRef<HTMLDivElement>(null)

  function choose(patient: Patient | null) {
    setChosen(patient)
    onChange?.(patient)
  }

  useEffect(() => {
    const query = term.trim()
    if (query.length < 2) {
      setResults([])
      setSearching(false)
      return
    }

    let live = true
    setSearching(true)
    const timer = setTimeout(async () => {
      const found = await findPatientsAction(query)
      if (!live) return
      setResults(found)
      setSearching(false)
      setOpen(true)
    }, 180)

    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [term])

  // Clicking anywhere else closes the list without choosing anything.
  useEffect(() => {
    function onDown(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  if (chosen) {
    return (
      <div className="flex flex-col gap-1.5">
        <Label>{label}</Label>
        <input type="hidden" name={name} value={chosen.id} />
        <div className="flex items-center gap-3 rounded-lg border border-accent/30 bg-accent-soft/60 px-3 py-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-ink font-display text-xs font-semibold">
            {initials(chosen.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-ink">{chosen.name}</span>
            <span className="block truncate font-mono text-[0.6875rem] text-ink-soft">
              {chosen.mrn} · {age(chosen.dob)} · {chosen.bloodGroup} · {chosen.phone}
            </span>
          </span>
          <button
            type="button"
            onClick={() => {
              choose(null)
              setTerm('')
              setResults([])
            }}
            className="grid size-7 shrink-0 place-items-center rounded-md text-ink-soft transition-colors hover:bg-surface-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
            aria-label="Choose a different patient"
          >
            <X className="size-3.5" />
          </button>
        </div>
        {chosen.allergies.length > 0 ? (
          <p className="text-xs font-medium text-vital-crit">
            Allergic to {chosen.allergies.join(', ')}.
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5" ref={boxRef}>
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
        <Input
          id={inputId}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search name, MRN or phone"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${inputId}-list`}
          aria-invalid={Boolean(error)}
          className="pl-9"
        />

        {open && results.length > 0 ? (
          <ul
            id={`${inputId}-list`}
            role="listbox"
            className="glass absolute z-20 mt-1.5 max-h-72 w-full overflow-auto rounded-xl p-1.5 shadow-lift"
          >
            {results.map((p) => (
              <li key={p.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  onClick={() => {
                    choose(p)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent-soft focus-visible:outline-none focus-visible:bg-accent-soft"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft font-display text-[0.6875rem] font-semibold text-accent">
                    {initials(p.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{p.name}</span>
                    <span className="block truncate font-mono text-[0.6875rem] text-ink-faint">
                      {p.mrn} · {p.phone}
                    </span>
                  </span>
                  {p.allergies.length > 0 ? (
                    <span
                      className="shrink-0 text-vital-crit"
                      title={`Allergic to ${p.allergies.join(', ')}`}
                    >
                      ●
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs font-medium text-vital-crit">{error}</p>
      ) : searching ? (
        <p className="text-xs text-ink-faint">Searching…</p>
      ) : term.trim().length >= 2 && results.length === 0 ? (
        <p className="text-xs text-ink-faint">
          Nobody matches. Register them from Patients → Add patient.
        </p>
      ) : (
        <p className="text-xs text-ink-faint">Type at least two characters.</p>
      )}
    </div>
  )
}
