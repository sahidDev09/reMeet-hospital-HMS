'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertTriangle, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { createPatientAction, type PatientFormState } from '@/app/actions/patients'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/label'
import { Input, NativeSelect, Textarea } from '@/components/ui/input'
import type { BloodGroup } from '@/lib/data/types'

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

/**
 * Registration.
 *
 * The desk fills this in while someone stands at the counter, so it asks for the
 * six things a visit cannot happen without and treats the rest as optional. Blood
 * group is required on purpose — it is the one field nobody wants to be looking
 * for in an emergency.
 *
 * Validation runs in the action, not here: the same rules will hold when a real
 * API is behind it, and a browser with JavaScript off still gets checked.
 */
export function PatientForm() {
  const [state, action] = useActionState<PatientFormState, FormData>(createPatientAction, {})
  const err = (field: string) => state.fieldErrors?.[field]

  return (
    <form action={action} className="grid gap-4 xl:grid-cols-[1fr_18rem] xl:items-start">
      <div className="flex flex-col gap-4">
        {state.error ? (
          <div className="flex items-start gap-3 rounded-xl border border-vital-crit/30 bg-vital-crit/[0.06] px-4 py-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-vital-crit" strokeWidth={2.5} />
            <p className="text-sm text-ink">{state.error}</p>
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Identity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              htmlFor="name"
              error={err('name')}
              className="sm:col-span-2"
            >
              <Input
                id="name"
                name="name"
                autoComplete="name"
                placeholder="As written on the NID or birth certificate"
                aria-invalid={Boolean(err('name'))}
                required
              />
            </Field>

            <Field label="Date of birth" htmlFor="dob" error={err('dob')}>
              <Input
                id="dob"
                name="dob"
                type="date"
                aria-invalid={Boolean(err('dob'))}
                required
              />
            </Field>

            <Field label="Gender" htmlFor="gender" error={err('gender')}>
              <NativeSelect id="gender" name="gender" defaultValue="" required>
                <option value="" disabled>
                  Select
                </option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </NativeSelect>
            </Field>

            <Field
              label="Blood group"
              htmlFor="bloodGroup"
              error={err('bloodGroup')}
              hint="Recorded now so nobody has to ask later."
            >
              <NativeSelect id="bloodGroup" name="bloodGroup" defaultValue="" required>
                <option value="" disabled>
                  Select
                </option>
                {BLOOD_GROUPS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Mobile number"
              htmlFor="phone"
              error={err('phone')}
              hint="Used for appointment reminders."
            >
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+880 1XXX XXXXXX"
                aria-invalid={Boolean(err('phone'))}
                required
              />
            </Field>

            <Field label="Email" htmlFor="email" error={err('email')} hint="Optional.">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                aria-invalid={Boolean(err('email'))}
              />
            </Field>

            <Field
              label="Address"
              htmlFor="address"
              error={err('address')}
              className="sm:col-span-2"
            >
              <Textarea
                id="address"
                name="address"
                rows={2}
                autoComplete="street-address"
                placeholder="House, road, area, city"
                aria-invalid={Boolean(err('address'))}
                required
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Clinical flags</CardTitle>
              <p className="mt-0.5 text-xs text-ink-soft">
                These show at the top of the patient file and beside every prescription.
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Known allergies"
              htmlFor="allergies"
              hint="Separate with commas. Leave empty if none."
            >
              <Input
                id="allergies"
                name="allergies"
                placeholder="Penicillin, Sulfa drugs"
              />
            </Field>

            <Field
              label="Ongoing conditions"
              htmlFor="conditions"
              hint="Separate with commas."
            >
              <Input
                id="conditions"
                name="conditions"
                placeholder="Type 2 diabetes, Hypertension"
              />
            </Field>
          </CardContent>
        </Card>
      </div>

      <Card className="p-5 xl:sticky xl:top-20">
        <p className="eyebrow mb-2 text-ink-faint">Before you save</p>
        <p className="text-sm text-ink-soft">
          reMeet assigns the MRN. Check the mobile number against the patient&rsquo;s phone — it is
          how every reminder and result reaches them.
        </p>
        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
          <SubmitButton />
          <Button asChild variant="ghost">
            <Link href="/patients">Cancel</Link>
          </Button>
        </div>
      </Card>
    </form>
  )
}

/** Split out so `useFormStatus` reads this form's own submission, not a parent's. */
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      <UserPlus className="size-4" />
      {pending ? 'Saving record…' : 'Save patient'}
    </Button>
  )
}
