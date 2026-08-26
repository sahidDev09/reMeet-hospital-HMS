'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertTriangle, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'
import {
  createPrescriptionAction,
  type PrescriptionState,
} from '@/app/actions/prescriptions'
import { MedicineSearch } from '@/components/app/medicine-search'
import { PatientPicker } from '@/components/app/patient-picker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, NativeSelect, Textarea } from '@/components/ui/input'
import { Field, Label } from '@/components/ui/label'
import type {
  Doctor,
  MealTiming,
  Medicine,
  Patient,
  PrescriptionItem,
} from '@/lib/data/types'
import { dosage } from '@/lib/format'

type Row = PrescriptionItem & { key: string }

const TIMINGS: Array<{ value: MealTiming; label: string }> = [
  { value: 'after-meal', label: 'After meals' },
  { value: 'before-meal', label: 'Before meals' },
  { value: 'anytime', label: 'Any time' },
]

/**
 * The prescription builder.
 *
 * Dosage is three number boxes reading morning-noon-night, not a text field —
 * `1-0-1` is the notation every patient in Bangladesh already reads off the sheet,
 * and free text is how "1+0+1" and "1-0-1" and "BD" end up on three sheets from
 * the same chamber.
 *
 * The one piece of real intelligence here: when a chosen medicine's name or
 * generic matches something in the patient's allergy list, the row turns red
 * before the sheet can be saved. That check costs nothing and is the whole reason
 * allergies are a field rather than a note.
 */
export function PrescriptionBuilder({
  doctors,
  defaultDoctorId,
  initialPatient,
  appointmentId,
  lockDoctor = false,
}: {
  doctors: Doctor[]
  defaultDoctorId?: string
  initialPatient?: Patient | null
  appointmentId?: string
  /** A doctor prescribes as themselves; the desk has to say who it was for. */
  lockDoctor?: boolean
}) {
  const [state, action] = useActionState<PrescriptionState, FormData>(
    createPrescriptionAction,
    {},
  )
  const [patient, setPatient] = useState<Patient | null>(initialPatient ?? null)
  const [rows, setRows] = useState<Row[]>([])

  const err = (field: string) => state.fieldErrors?.[field]

  function add(medicine: Medicine) {
    setRows((current) => [
      ...current,
      {
        key: `${medicine.id}-${current.length}`,
        medicineId: medicine.id,
        name: medicine.name,
        generic: medicine.generic,
        strength: medicine.strength,
        form: medicine.form,
        // The commonest sane starting point; the doctor adjusts from here.
        dosage: { morning: 1, noon: 0, night: 1 },
        timing: 'after-meal',
        durationDays: 7,
        instructions: '',
      },
    ])
  }

  function patch(key: string, changes: Partial<PrescriptionItem>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...changes } : row)),
    )
  }

  function remove(key: string) {
    setRows((current) => current.filter((row) => row.key !== key))
  }

  /** An allergy hit is a substring match either way round — "Penicillin" has to
   *  catch "Amoxicillin + Clavulanic acid" written as a penicillin-class drug. */
  function allergyHit(row: Row): string | null {
    if (!patient) return null
    const haystack = `${row.name} ${row.generic ?? ''}`.toLowerCase()
    return (
      patient.allergies.find((allergy) => {
        const needle = allergy.toLowerCase().split(' ')[0]!
        return needle.length > 3 && haystack.includes(needle)
      }) ?? null
    )
  }

  const conflicts = rows.map(allergyHit).filter(Boolean) as string[]

  return (
    <form action={action} className="grid gap-4 xl:grid-cols-[1fr_19rem] xl:items-start">
      {/* The rows travel as one JSON field — see the action for why. */}
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          rows.map(({ key: _key, ...item }) => item),
        )}
      />
      {appointmentId ? (
        <input type="hidden" name="appointmentId" value={appointmentId} />
      ) : null}

      <div className="flex flex-col gap-4">
        {state.error ? (
          <div className="flex items-start gap-3 rounded-xl border border-vital-crit/30 bg-vital-crit/[0.06] px-4 py-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-vital-crit" strokeWidth={2.5} />
            <div>
              <p className="text-sm font-medium text-ink">{state.error}</p>
              {err('items') ? <p className="text-sm text-ink-soft">{err('items')}</p> : null}
            </div>
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Patient</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <PatientPicker
              initial={initialPatient}
              error={err('patientId')}
              onChange={setPatient}
            />
            <Field label="Prescribing doctor" htmlFor="doctorId" error={err('doctorId')}>
              {lockDoctor && defaultDoctorId ? (
                <>
                  <input type="hidden" name="doctorId" value={defaultDoctorId} />
                  <p className="flex h-10 items-center rounded-lg border border-line bg-surface-solid/40 px-3 text-sm text-ink">
                    {doctors.find((d) => d.id === defaultDoctorId)?.name ?? 'You'}
                  </p>
                </>
              ) : (
                <NativeSelect id="doctorId" name="doctorId" defaultValue={defaultDoctorId ?? ''} required>
                  <option value="" disabled>
                    Select
                  </option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.specialty}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Findings</CardTitle>
              <p className="mt-0.5 text-xs text-ink-soft">
                Vitals are optional; complaints and diagnosis print on the sheet.
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Field label="BP" htmlFor="bp">
                <Input id="bp" name="bp" placeholder="120/80" />
              </Field>
              <Field label="Pulse" htmlFor="pulse">
                <Input id="pulse" name="pulse" type="number" min={20} max={220} placeholder="78" />
              </Field>
              <Field label="Temp °F" htmlFor="tempF">
                <Input
                  id="tempF"
                  name="tempF"
                  type="number"
                  step="0.1"
                  min={90}
                  max={110}
                  placeholder="98.4"
                />
              </Field>
              <Field label="Weight kg" htmlFor="weightKg">
                <Input
                  id="weightKg"
                  name="weightKg"
                  type="number"
                  step="0.1"
                  min={1}
                  max={250}
                  placeholder="68"
                />
              </Field>
              <Field label="SpO₂ %" htmlFor="spo2">
                <Input id="spo2" name="spo2" type="number" min={50} max={100} placeholder="98" />
              </Field>
            </div>

            <Field label="Complaints" htmlFor="complaints" error={err('complaints')}>
              <Textarea
                id="complaints"
                name="complaints"
                rows={2}
                placeholder="Fever for three days, dry cough, no breathlessness"
                required
              />
            </Field>

            <Field label="Diagnosis" htmlFor="diagnosis" error={err('diagnosis')}>
              <Input
                id="diagnosis"
                name="diagnosis"
                placeholder="Acute viral pharyngitis"
                required
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Medicines</CardTitle>
              <p className="mt-0.5 text-xs text-ink-soft">
                {rows.length === 0
                  ? 'Search the shelf and add what you are prescribing.'
                  : `${rows.length} on the sheet.`}
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <MedicineSearch
              onPick={add}
              hint="Brand or generic. Adds a row with 1-0-1 for seven days, which you can change."
            />

            {conflicts.length > 0 ? (
              <div className="flex items-start gap-3 rounded-xl border border-vital-crit/40 bg-vital-crit/[0.08] px-4 py-3">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-vital-crit"
                  strokeWidth={2.5}
                />
                <p className="text-sm text-ink">
                  <span className="font-medium">
                    This patient is recorded as allergic to {[...new Set(conflicts)].join(', ')}.
                  </span>{' '}
                  <span className="text-ink-soft">
                    Remove the flagged row, or prescribe something else.
                  </span>
                </p>
              </div>
            ) : null}

            {rows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-ink-faint">
                No medicines yet. The sheet needs at least one.
              </p>
            ) : (
              <ol className="flex flex-col gap-3">
                {rows.map((row, index) => {
                  const hit = allergyHit(row)
                  return (
                    <li
                      key={row.key}
                      className={
                        hit
                          ? 'rounded-xl border border-vital-crit/40 bg-vital-crit/[0.05] p-3.5'
                          : 'rounded-xl border border-line bg-surface-solid/40 p-3.5'
                      }
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 text-sm font-medium text-ink">
                            <span className="font-mono text-[0.6875rem] text-ink-faint">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            {row.name}
                            <span className="font-mono text-xs font-normal text-ink-soft">
                              {row.strength}
                            </span>
                            <span className="font-mono text-xs font-semibold text-accent">
                              {dosage(row.dosage)}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs capitalize text-ink-faint">
                            {row.generic} · {row.form}
                          </p>
                          {hit ? (
                            <p className="mt-1 text-xs font-semibold text-vital-crit">
                              Allergy on record: {hit}
                            </p>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${row.name}`}
                          onClick={() => remove(row.key)}
                        >
                          <Trash2 />
                        </Button>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-[auto_1fr_1fr]">
                        <div>
                          <Label className="mb-1.5 block">Morning · Noon · Night</Label>
                          <div className="flex items-center gap-1.5">
                            {(['morning', 'noon', 'night'] as const).map((slot) => (
                              <Input
                                key={slot}
                                type="number"
                                min={0}
                                max={6}
                                step="0.5"
                                aria-label={`${slot} dose for ${row.name}`}
                                value={row.dosage[slot]}
                                onChange={(e) =>
                                  patch(row.key, {
                                    dosage: {
                                      ...row.dosage,
                                      [slot]: Number(e.target.value || 0),
                                    },
                                  })
                                }
                                className="w-14 text-center"
                              />
                            ))}
                          </div>
                        </div>

                        <Field label="Timing">
                          <NativeSelect
                            value={row.timing}
                            aria-label={`Timing for ${row.name}`}
                            onChange={(e) =>
                              patch(row.key, { timing: e.target.value as MealTiming })
                            }
                          >
                            {TIMINGS.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </NativeSelect>
                        </Field>

                        <Field label="Days">
                          <Input
                            type="number"
                            min={1}
                            max={180}
                            aria-label={`Duration in days for ${row.name}`}
                            value={row.durationDays}
                            onChange={(e) =>
                              patch(row.key, { durationDays: Number(e.target.value || 1) })
                            }
                          />
                        </Field>

                        <Field label="Instructions on the sheet" className="sm:col-span-3">
                          <Input
                            value={row.instructions ?? ''}
                            aria-label={`Instructions for ${row.name}`}
                            placeholder="Finish the full course · Take with water"
                            onChange={(e) => patch(row.key, { instructions: e.target.value })}
                          />
                        </Field>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advice, tests and follow-up</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Advice" htmlFor="advice" hint="One per line. Prints as a list.">
              <Textarea
                id="advice"
                name="advice"
                rows={4}
                placeholder={'Plenty of fluids\nRest for three days\nSteam inhalation twice daily'}
              />
            </Field>
            <Field label="Investigations" htmlFor="labTests" hint="One per line.">
              <Textarea
                id="labTests"
                name="labTests"
                rows={4}
                placeholder={'CBC with ESR\nChest X-ray PA view'}
              />
            </Field>
            <Field label="Follow-up date" htmlFor="followUpAt" hint="Optional.">
              <Input
                id="followUpAt"
                name="followUpAt"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
              />
            </Field>
          </CardContent>
        </Card>
      </div>

      {/* --- Summary rail --- */}
      <Card className="p-5 xl:sticky xl:top-20">
        <p className="eyebrow mb-3 text-ink-faint">On this sheet</p>
        {patient ? (
          <div className="mb-3 border-b border-line pb-3">
            <p className="text-sm font-medium text-ink">{patient.name}</p>
            <p className="font-mono text-[0.6875rem] text-ink-faint">{patient.mrn}</p>
            {patient.allergies.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {patient.allergies.map((a) => (
                  <Badge key={a} tone="crit">
                    {a}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mb-3 border-b border-line pb-3 text-sm text-ink-faint">
            No patient chosen yet.
          </p>
        )}

        {rows.length === 0 ? (
          <p className="text-sm text-ink-faint">Medicines appear here as you add them.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {rows.map((row) => (
              <li key={row.key} className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate text-xs text-ink">{row.name}</span>
                <span className="shrink-0 font-mono text-[0.6875rem] font-medium text-accent">
                  {dosage(row.dosage)} · {row.durationDays}d
                </span>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
          <SubmitButton disabled={rows.length === 0 || conflicts.length > 0} />
          <Button asChild variant="ghost">
            <Link href="/prescriptions">Cancel</Link>
          </Button>
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          Saving opens the printable sheet. Nothing is dispensed until the counter sells it.
        </p>
      </Card>
    </form>
  )
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending || disabled}>
      <Save className="size-4" />
      {pending ? 'Saving…' : 'Save prescription'}
    </Button>
  )
}
