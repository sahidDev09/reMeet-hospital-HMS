'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createPatient } from '@/lib/data/patients'
import type { BloodGroup, Gender } from '@/lib/data/types'

export type PatientFormState = {
  error?: string
  fieldErrors?: Record<string, string>
}

const REQUIRED = ['name', 'dob', 'gender', 'bloodGroup', 'phone', 'address'] as const

/** Splits the comma-separated allergy and condition fields into clean arrays. */
function toList(value: string | null): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export async function createPatientAction(
  _prev: PatientFormState,
  formData: FormData,
): Promise<PatientFormState> {
  const get = (key: string) => (formData.get(key) as string | null)?.trim() ?? ''

  const fieldErrors: Record<string, string> = {}
  for (const key of REQUIRED) {
    if (!get(key)) fieldErrors[key] = 'Required'
  }

  const dob = get('dob')
  if (dob && new Date(dob) > new Date()) {
    fieldErrors.dob = 'Date of birth cannot be in the future'
  }

  const phone = get('phone')
  if (phone && phone.replace(/\D/g, '').length < 9) {
    fieldErrors.phone = 'Enter a full phone number'
  }

  const email = get('email')
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = 'Check the email address'
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: 'Some details need fixing.', fieldErrors }
  }

  const patient = await createPatient({
    name: get('name'),
    dob,
    gender: get('gender') as Gender,
    bloodGroup: get('bloodGroup') as BloodGroup,
    phone,
    email: email || undefined,
    address: get('address'),
    allergies: toList(formData.get('allergies') as string | null),
    conditions: toList(formData.get('conditions') as string | null),
  })

  revalidatePath('/patients')
  redirect(`/patients/${patient.id}?created=1`)
}
