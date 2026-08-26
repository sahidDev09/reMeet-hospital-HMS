'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { Wordmark } from '@/components/brand/logo'
import { PulseLine } from '@/components/brand/pulse-line'
import { ROLE_LABEL } from '@/lib/auth/role-meta'
import type { Role } from '@/lib/data/types'
import { navFor } from '@/lib/nav'
import { cn } from '@/lib/utils'

/**
 * The nav. Sections are named for what someone is doing — Overview, Care,
 * Counter — because that's how the day is actually divided at a clinic, and it
 * keeps the front desk from hunting through clinical screens.
 */
export function Sidebar({
  role,
  onNavigate,
  className,
}: {
  role: Role
  onNavigate?: () => void
  className?: string
}) {
  const pathname = usePathname()
  const groups = navFor(role)

  return (
    <div className={cn('flex h-full flex-col gap-6 overflow-y-auto px-4 py-5', className)}>
      <div className="flex items-center justify-between">
        <Link
          href={role === 'doctor' ? '/portal' : '/dashboard'}
          className="flex items-center gap-2.5 rounded-lg"
          onClick={onNavigate}
        >
          <Wordmark className="text-base" />
        </Link>
        {onNavigate ? (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close menu"
            className="grid size-8 cursor-pointer place-items-center rounded-lg text-ink-soft hover:bg-accent-soft lg:hidden"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-5">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <p className="eyebrow px-2.5 pb-1 text-ink-faint">{group.label}</p>
            {group.items.map((item) => {
              // Exact match, or a child route — /patients/pat_01 keeps Patients lit.
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                    active
                      ? 'bg-accent-soft font-medium text-accent'
                      : 'text-ink-soft hover:bg-accent-soft/60 hover:text-ink',
                  )}
                >
                  {/* The active marker is a segment of the pulse line, not a plain bar. */}
                  {active ? (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-4 w-0.5 -translate-x-2 -translate-y-1/2 rounded-full bg-accent"
                    />
                  ) : null}
                  <item.icon
                    className={cn('size-4 shrink-0', active ? 'text-accent' : 'text-ink-faint')}
                    strokeWidth={2}
                  />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3">
        <PulseLine variant="rule" className="h-3 w-full text-accent/40" />
        <p className="eyebrow text-ink-faint">Signed in as</p>
        <p className="text-sm font-medium text-ink">{ROLE_LABEL[role]}</p>
      </div>
    </div>
  )
}
