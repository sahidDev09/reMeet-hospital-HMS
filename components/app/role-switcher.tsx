'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'
import { setReviewRole } from '@/app/actions/role'
import { NativeSelect } from '@/components/ui/input'
import { ROLE_LABEL, ROLES } from '@/lib/auth/role-meta'
import type { Role } from '@/lib/data/types'

/**
 * Switches the role the app renders for, so the doctor portal and front-desk
 * views can be reviewed without three Clerk accounts.
 *
 * Development only, and not a permission boundary — it changes what the UI
 * offers, not what a server would allow. It disappears in production builds.
 */
export function RoleSwitcher({ role }: { role: Role }) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  if (process.env.NODE_ENV === 'production') return null

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
            router.replace(next === 'doctor' ? '/portal' : '/dashboard')
          })
        }}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </NativeSelect>
    </label>
  )
}
