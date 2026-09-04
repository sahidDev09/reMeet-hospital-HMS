import type { Role } from '@/lib/data/types'

/**
 * Role facts with no server dependencies.
 *
 * Kept apart from `roles.ts` on purpose: that file reads the server session and
 * the cookie jar, so it can only run on the server. The sidebar and the dev role
 * switcher are client components and need the labels — importing them from here
 * keeps `next/headers` out of the browser bundle.
 */
export const ROLES = ['admin', 'doctor', 'staff', 'patient'] as const satisfies readonly Role[]

export const ROLE_COOKIE = 'remeet_role'

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrator',
  doctor: 'Doctor',
  staff: 'Front desk',
  patient: 'Patient',
}

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

/** Where each role should land after signing in. */
export function homeFor(role: Role): string {
  if (role === 'doctor') return '/portal'
  if (role === 'patient') return '/patient'
  return '/dashboard'
}

/**
 * The doctor a signed-in doctor *is*. With no backend there's no mapping from
 * auth user to staff record, so the portal reviews against the first doctor on
 * the roster. Swap this for a lookup by user id once accounts are linked.
 */
export const DEMO_DOCTOR_ID = 'doc_01'
