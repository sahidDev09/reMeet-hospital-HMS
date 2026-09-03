'use client'

import * as React from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Avatar from '@radix-ui/react-avatar'
import {
  LogOut,
  User,
  ShieldCheck,
  Stethoscope,
  Building2,
  ChevronDown,
  LayoutDashboard,
  Check,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/context'
import { ROLE_LABEL, ROLES } from '@/lib/auth/role-meta'
import type { Role } from '@/lib/data/types'
import { cn } from '@/lib/utils'

export function UserMenu() {
  const { user, signOut, switchRole, role } = useAuth()
  const [open, setOpen] = React.useState(false)
  const [signingOut, setSigningOut] = React.useState(false)

  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="inline-flex h-8 items-center justify-center rounded-lg bg-accent px-3 text-xs font-semibold text-accent-ink transition-opacity hover:opacity-90"
      >
        Sign in
      </Link>
    )
  }

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
  }

  const roleIcon =
    role === 'doctor' ? (
      <Stethoscope className="size-3.5 text-indigo-500" />
    ) : role === 'admin' ? (
      <ShieldCheck className="size-3.5 text-accent" />
    ) : (
      <Building2 className="size-3.5 text-teal-500" />
    )

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="User account menu"
          className="group flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface p-1 pr-2 transition-all hover:border-line-strong hover:bg-surface-strong focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <Avatar.Root className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-accent/15 text-accent font-semibold text-xs ring-1 ring-black/5 dark:ring-white/10">
            {user.image ? (
              <Avatar.Image
                src={user.image}
                alt={user.name}
                className="size-full object-cover"
              />
            ) : null}
            <Avatar.Fallback className="font-mono text-[0.6875rem] font-bold">
              {initials}
            </Avatar.Fallback>
          </Avatar.Root>
          <span className="hidden max-w-[100px] truncate text-xs font-medium text-ink sm:inline-block">
            {user.name.split(' ')[0]}
          </span>
          <ChevronDown className="size-3 text-ink-faint transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-64 animate-in fade-in-50 zoom-in-95 rounded-2xl border border-line bg-surface p-1.5 shadow-2xl backdrop-blur-xl duration-150 focus:outline-none"
        >
          {/* User Info Header */}
          <div className="flex items-center gap-3 border-b border-line p-3 pb-3.5">
            <Avatar.Root className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent/15 text-accent font-bold text-sm ring-1 ring-black/10">
              {user.image ? (
                <Avatar.Image src={user.image} alt={user.name} className="size-full object-cover" />
              ) : null}
              <Avatar.Fallback className="font-mono">{initials}</Avatar.Fallback>
            </Avatar.Root>
            <div className="flex flex-col min-w-0">
              <p className="truncate text-xs font-semibold text-ink">{user.name}</p>
              <p className="truncate text-[0.6875rem] text-ink-soft">{user.email}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[0.625rem] font-medium text-accent">
                  {roleIcon}
                  {ROLE_LABEL[role] || 'User'}
                </span>
                {user.provider && (
                  <span className="text-[0.625rem] text-ink-faint capitalize">({user.provider})</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Navigation Items */}
          <div className="py-1">
            <DropdownMenu.Item asChild>
              <Link
                href={role === 'doctor' ? '/portal' : '/dashboard'}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-ink transition-colors hover:bg-accent-soft hover:text-accent focus:bg-accent-soft focus:text-accent focus:outline-none"
              >
                <LayoutDashboard className="size-4 text-ink-soft" />
                <span>{role === 'doctor' ? 'Doctor Portal' : 'Hospital Dashboard'}</span>
              </Link>
            </DropdownMenu.Item>

            {role === 'doctor' && (
              <DropdownMenu.Item asChild>
                <Link
                  href="/portal/patients"
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-ink transition-colors hover:bg-accent-soft hover:text-accent focus:bg-accent-soft focus:text-accent focus:outline-none"
                >
                  <User className="size-4 text-ink-soft" />
                  <span>My Assigned Patients</span>
                </Link>
              </DropdownMenu.Item>
            )}
          </div>

          {/* Switch Active Role */}
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <div className="px-2.5 py-1.5">
            <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-ink-faint">
              Switch Role View
            </p>
            <div className="mt-1 flex flex-col gap-0.5">
              {ROLES.map((r) => {
                const isActive = r === role
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => switchRole(r)}
                    className={cn(
                      'flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors',
                      isActive
                        ? 'bg-accent/15 font-semibold text-accent'
                        : 'text-ink-soft hover:bg-accent-soft/60 hover:text-ink',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {r === 'doctor' ? (
                        <Stethoscope className="size-3.5" />
                      ) : r === 'admin' ? (
                        <ShieldCheck className="size-3.5" />
                      ) : (
                        <Building2 className="size-3.5" />
                      )}
                      {ROLE_LABEL[r]}
                    </span>
                    {isActive && <Check className="size-3 text-accent" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sign Out Button */}
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item
            onSelect={handleSignOut}
            disabled={signingOut}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-500 transition-colors hover:bg-rose-500/10 focus:bg-rose-500/10 focus:outline-none"
          >
            <LogOut className="size-4" />
            <span>{signingOut ? 'Signing out...' : 'Sign out'}</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
