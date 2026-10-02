import { auth } from '@/lib/auth/session'
import { Shell } from '@/components/app/shell'
import { getRole } from '@/lib/auth/roles'
import { isUserVerified } from '@/lib/data/verifications'
import { redirect } from 'next/navigation'

/**
 * Everything under this layout requires a session.
 *
 * `auth.protect()` is called here rather than pattern-matched in proxy.ts: this
 * is the boundary, so this is where the check belongs. A new route added inside
 * the group inherits it automatically instead of needing a matcher updated.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { protect } = await auth()
  const user = await protect()
  const role = await getRole()

  // Verification enforcement: doctors and front desk staff require administrator approval
  if (role === 'doctor' || role === 'staff') {
    const verified = await isUserVerified(user?.email || '', role)
    if (!verified) {
      redirect('/verification-pending')
    }
  }

  return <Shell role={role}>{children}</Shell>
}
