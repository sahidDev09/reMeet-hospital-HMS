'use client'

import { Menu, Search } from 'lucide-react'
import { usePathname } from 'next/navigation'
import * as React from 'react'
import { RoleSwitcher } from '@/components/app/role-switcher'
import { ThemeToggle } from '@/components/app/theme-toggle'
import { UserMenu } from '@/components/auth/user-menu'
import type { Role } from '@/lib/data/types'
import { NAV } from '@/lib/nav'

/** The label for the section we're in, taken from the nav so the two never drift. */
function sectionLabel(pathname: string): string {
  for (const group of NAV) {
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return item.label
    }
  }
  const last = pathname.split('/').filter(Boolean).pop() ?? ''
  return last.charAt(0).toUpperCase() + last.slice(1)
}

export function Topbar({
  role,
  onOpenMenu,
  onOpenSearch,
}: {
  role: Role
  onOpenMenu: () => void
  onOpenSearch: () => void
}) {
  const pathname = usePathname()
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform ?? '')

  return (
    <header
      data-print="hide"
      className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl sm:px-6"
    >
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="grid size-9 cursor-pointer place-items-center rounded-lg text-ink-soft hover:bg-accent-soft lg:hidden"
      >
        <Menu className="size-4.5" />
      </button>

      <p className="font-display text-sm font-medium tracking-[-0.01em] text-ink">
        {sectionLabel(pathname)}
      </p>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-ink-faint transition-colors hover:border-line-strong hover:text-ink-soft"
        >
          <Search className="size-3.5" />
          <span className="hidden text-xs sm:inline">Search records</span>
          <kbd className="hidden rounded border border-line px-1 font-mono text-[0.625rem] md:inline">
            {isMac ? '⌘K' : 'Ctrl K'}
          </kbd>
        </button>

        <RoleSwitcher role={role} />
        <ThemeToggle className="hidden sm:flex" />
        <UserMenu />
      </div>
    </header>
  )
}
