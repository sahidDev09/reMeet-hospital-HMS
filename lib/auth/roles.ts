import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ROLE_COOKIE, isRole } from '@/lib/auth/role-meta'
import type { Role } from '@/lib/data/types'

/**
 * Server-side role reads. The plain facts — labels, the cookie name, where each
 * role lands — live in `role-meta.ts` so client components can share them without
 * dragging `next/headers` into the browser bundle.
 */
export { DEMO_DOCTOR_ID, ROLES, ROLE_COOKIE, ROLE_LABEL, homeFor, isRole } from '@/lib/auth/role-meta'

/**
 * The signed-in user's role.
 *
 * Order matters: the Clerk session claim is the real source of truth and always
 * wins. The `remeet_role` cookie is only consulted when no claim is present —
 * which is the case until the session-token mapping is configured in the Clerk
 * Dashboard, and without it the doctor portal and staff views are unreachable
 * for review.
 *
 * The cookie is set by a dev-only switcher in the topbar. It is a review
 * affordance, not access control: anything the cookie unlocks is unlocked
 * client-side too. Real enforcement belongs on the server that owns the data.
 */
export async function getRole(): Promise<Role> {
  const { sessionClaims } = await auth()

  const claim = sessionClaims?.metadata?.role
  if (isRole(claim)) return claim

  if (process.env.NODE_ENV !== 'production') {
    const jar = await cookies()
    const stored = jar.get(ROLE_COOKIE)?.value
    if (isRole(stored)) return stored
  }

  // Reviewers land on the fullest version of the app rather than an empty one.
  return 'admin'
}

/** Sends anyone without one of the allowed roles somewhere they can actually be. */
export async function requireRole(...allowed: Role[]): Promise<Role> {
  const role = await getRole()
  if (!allowed.includes(role)) {
    redirect(role === 'doctor' ? '/portal' : '/dashboard')
  }
  return role
}
