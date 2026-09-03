'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'
import { setReviewRole } from '@/app/actions/role'
import { NativeSelect } from '@/components/ui/input'
import { ROLE_LABEL, ROLES } from '@/lib/auth/role-meta'
import { useAuth } from '@/lib/auth/context'
import type { Role } from '@/lib/data/types'

/**
 * Switches the role the app renders for, so the doctor portal and front-desk
 * views can be reviewed without separate accounts.
 *
 * Development only, and not a permission boundary — it changes what the UI
 * offers, not what a server would allow. It disappears in production builds.
 */
export function RoleSwitcher({ role }: { role: Role }) {
  const { user, switchRole } = useAuth()
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  if (process.env.NODE_ENV === 'production') return null

  const email = user?.email?.toLowerCase()
  const isAdminAccount = email === 'iambotforwork72@gmail.com' || role === 'admin'

  // Administrator accounts (e.g. iambotforwork72@gmail.com) only see Administrator and Front desk
  const availableRoles = isAdminAccount ? ROLES.filter((r) => r !== 'doctor') : ROLES

  return (
    <label className="flex items-center gap-2" title="Development only — not access control">
      <span className="eyebrow hidden text-ink-faint sm:inline">Viewing as</span>
      <NativeSelect
        value={role}
        disabled={pending}
        aria-label="Review role"
        className="h-8 w-[8.5rem] pl-2.5 text-xs"
        onChange={(e) => {
          const next = e.target.value as Role
          startTransition(async () => {
            await setReviewRole(next)
            await switchRole(next)
            router.replace(next === 'doctor' ? '/portal' : '/dashboard')
          })
        }}
      >
        {availableRoles.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </NativeSelect>
    </label>
  )
}
