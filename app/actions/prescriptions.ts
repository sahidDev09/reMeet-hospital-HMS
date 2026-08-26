'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createPrescription } from '@/lib/data/prescriptions'
import { searchMedicines } from '@/lib/data/pharmacy'
import type { Medicine, PrescriptionItem, Vitals } from '@/lib/data/types'

/** Medicine lookup for the builder's drug field. */
export async function findMedicinesAction(term: string): Promise<Medicine[]> {
  if (term.trim().length < 2) return []
  return searchMedicines(term, 8)
}

export type PrescriptionState = {
  error?: string
  fieldErrors?: Record<string, string>
}

function toLines(value: string): string[] {
  return value
    .split('\n')
    .map((s) => s.replace(/^[-·•]\s*/, '').trim())
    .filter(Boolean)
}

function toVitals(get: (key: string) => string): Vitals | undefined {
  const vitals: Vitals = {}
  if (get('bp')) vitals.bp = get('bp')
  if (get('pulse')) vitals.pulse = Number(get('pulse'))
  if (get('tempF')) vitals.tempF = Number(get('tempF'))
  if (get('weightKg')) vitals.weightKg = Number(get('weightKg'))
  if (get('spo2')) vitals.spo2 = Number(get('spo2'))
  return Object.keys(vitals).length > 0 ? vitals : undefined
}

/**
 * Saving a prescription.
 *
 * The medicine rows arrive as one JSON field rather than `items[0][name]`-style
 * inputs. The builder adds and removes rows freely, so a flat encoding would mean
 * reindexing every input name on every delete — a class of bug with no upside.
 * The JSON is parsed and checked here, not trusted.
 */
export async function createPrescriptionAction(
  _prev: PrescriptionState,
  formData: FormData,
): Promise<PrescriptionState> {
  const get = (key: string) => (formData.get(key) as string | null)?.trim() ?? ''

  const patientId = get('patientId')
  const doctorId = get('doctorId')
  const complaints = get('complaints')
  const diagnosis = get('diagnosis')

  const fieldErrors: Record<string, string> = {}
  if (!patientId) fieldErrors.patientId = 'Choose a patient'
  if (!doctorId) fieldErrors.doctorId = 'Choose the prescribing doctor'
  if (!complaints) fieldErrors.complaints = 'Record what they came in with'
  if (!diagnosis) fieldErrors.diagnosis = 'Record a diagnosis'

  let items: PrescriptionItem[] = []
  try {
    const parsed = JSON.parse(get('items') || '[]') as PrescriptionItem[]
    items = parsed.filter((item) => item.name?.trim())
  } catch {
    return { error: 'The medicine list could not be read. Reload and try again.' }
  }

  if (items.length === 0) {
    fieldErrors.items = 'Add at least one medicine'
  }

  const zeroDose = items.find(
    (item) => item.dosage.morning + item.dosage.noon + item.dosage.night === 0,
  )
  if (zeroDose) {
    fieldErrors.items = `${zeroDose.name} has no doses set — 0-0-0 tells the patient nothing.`
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: 'The sheet is not ready to save.', fieldErrors }
  }

  const rx = await createPrescription({
    patientId,
    doctorId,
    appointmentId: get('appointmentId') || undefined,
    complaints,
    diagnosis,
    vitals: toVitals(get),
    items,
    advice: toLines((formData.get('advice') as string | null) ?? ''),
    labTests: toLines((formData.get('labTests') as string | null) ?? ''),
    followUpAt: get('followUpAt') || undefined,
  })

  revalidatePath('/prescriptions')
  revalidatePath('/portal')
  revalidatePath(`/patients/${patientId}`)

  redirect(`/prescriptions/${rx.id}`)
}
