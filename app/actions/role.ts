'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { ROLE_COOKIE, ROLES } from '@/lib/auth/roles'
import type { Role } from '@/lib/data/types'

/**
 * Sets the review role cookie.
 *
 * Development only. The real role comes from the Clerk session claim, which this
 * cannot override — see the ordering in lib/auth/roles.ts. Delete this file and
 * the topbar switcher when the Dashboard session token is configured.
 */
export async function setReviewRole(role: Role) {
  if (process.env.NODE_ENV === 'production') return
  if (!(ROLES as readonly string[]).includes(role)) return

  const jar = await cookies()
  jar.set(ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  revalidatePath('/', 'layout')
}
