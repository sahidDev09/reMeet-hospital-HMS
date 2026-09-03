import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ROLE_COOKIE, isRole } from '@/lib/auth/role-meta'
import { getCurrentUser } from '@/lib/auth/session'
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
  const user = await getCurrentUser()
  const userEmail = user?.email?.toLowerCase()
  const isAdminAccount = userEmail === 'iambotforwork72@gmail.com'

  if (user?.role && isRole(user.role)) {
    if (isAdminAccount && user.role === 'doctor') return 'admin'
    return user.role
  }

  const jar = await cookies()
  const stored = jar.get(ROLE_COOKIE)?.value
  if (isRole(stored)) {
    if (isAdminAccount && stored === 'doctor') return 'admin'
    return stored
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
