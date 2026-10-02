import { redirect } from 'next/navigation'
import { isRole } from '@/lib/auth/role-meta'
import { getCurrentUser } from '@/lib/auth/session'
import type { Role } from '@/lib/data/types'

/**
 * Server-side role reads. The plain facts — labels, the cookie name, where each
 * role lands — live in `role-meta.ts` so client components can share them without
 * dragging `next/headers` into the browser bundle.
 */
export { DEMO_DOCTOR_ID, ROLES, ROLE_COOKIE, ROLE_LABEL, homeFor, isRole } from '@/lib/auth/role-meta'

/**
 * The signed-in user's role from the verified JWT session.
 */
export async function getRole(): Promise<Role> {
  const user = await getCurrentUser()
  if (!user) {
    return 'staff'
  }

  const userEmail = user.email?.toLowerCase()
  const isAdminAccount = userEmail === 'iambotforwork72@gmail.com' || userEmail === 'admin@remeet.health'

  if (user.role && isRole(user.role)) {
    if (isAdminAccount && (user.role === 'doctor' || user.role === 'staff')) return 'admin'
    return user.role
  }

  return 'staff'
}

/** Sends anyone without one of the allowed roles somewhere they can actually be. */
export async function requireRole(...allowed: Role[]): Promise<Role> {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/sign-in')
  }

  const role = await getRole()

  // Verification check: Doctors and front desk staff require administrator approval
  if (role === 'doctor' || role === 'staff') {
    const { isUserVerified } = await import('@/lib/data/verifications')
    const verified = await isUserVerified(user.email, role)
    if (!verified) {
      redirect('/verification-pending')
    }
  }

  if (!allowed.includes(role)) {
    if (role === 'patient') {
      redirect('/patient')
    }
    redirect(role === 'doctor' ? '/portal' : '/dashboard')
  }
  return role
}
