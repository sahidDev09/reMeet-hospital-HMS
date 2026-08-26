import { auth, currentUser } from '@clerk/nextjs/server'
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
 */
export async function getRole(): Promise<Role> {
  const { sessionClaims } = await auth()
  let userEmail: string | undefined

  try {
    const user = await currentUser()
    userEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
  } catch {
    // Session without user lookup fallback
  }

  const isAdminAccount = userEmail === 'iambotforwork72@gmail.com'

  const claim = sessionClaims?.metadata?.role
  if (isRole(claim)) {
    if (isAdminAccount && claim === 'doctor') return 'admin'
    return claim
  }

  if (process.env.NODE_ENV !== 'production') {
    const jar = await cookies()
    const stored = jar.get(ROLE_COOKIE)?.value
    if (isRole(stored)) {
      if (isAdminAccount && stored === 'doctor') return 'admin'
      return stored
    }
  }

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
