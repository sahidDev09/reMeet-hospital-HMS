'use server'

import { revalidatePath } from 'next/cache'
import { ROLE_COOKIE, ROLES } from '@/lib/auth/roles'
import { updateSessionRole } from '@/lib/auth/session'
import type { Role } from '@/lib/data/types'

/**
 * Sets the review role cookie and updates the session.
 */
export async function setReviewRole(role: Role) {
  if (process.env.NODE_ENV === 'production') return
  if (!(ROLES as readonly string[]).includes(role)) return

  await updateSessionRole(role)
  revalidatePath('/', 'layout')
}
