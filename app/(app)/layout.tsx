import { auth } from '@/lib/auth/session'
import { Shell } from '@/components/app/shell'
import { getRole } from '@/lib/auth/roles'

/**
 * Everything under this layout requires a session.
 *
 * `auth.protect()` is called here rather than pattern-matched in proxy.ts: this
 * is the boundary, so this is where the check belongs. A new route added inside
 * the group inherits it automatically instead of needing a matcher updated.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { protect } = await auth()
  await protect()
  const role = await getRole()

  return <Shell role={role}>{children}</Shell>
}
