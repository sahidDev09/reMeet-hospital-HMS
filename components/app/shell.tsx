'use client'

import { usePathname } from 'next/navigation'
import * as React from 'react'
import { CommandPalette } from '@/components/app/command-palette'
import { Sidebar } from '@/components/app/sidebar'
import { Topbar } from '@/components/app/topbar'
import type { Role } from '@/lib/data/types'

/**
 * The application frame: a fixed rail on desktop, a slide-over on narrow
 * screens, and one command palette shared by both.
 *
 * This is a client component only because the mobile drawer and the palette need
 * state. Every page inside it stays a server component.
 */
export function Shell({ role, children }: { role: Role; children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const pathname = usePathname()

  // Navigating on mobile should close the drawer even when the click came from
  // somewhere other than a nav link.
  React.useEffect(() => setMenuOpen(false), [pathname])

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      {/* Desktop rail */}
      <aside
        data-print="hide"
        className="sticky top-0 hidden h-dvh border-r border-line bg-surface/50 backdrop-blur-xl lg:block"
      >
        <Sidebar role={role} />
      </aside>

      {/* Mobile drawer */}
      {menuOpen ? (
        <div data-print="hide" className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            onClick={() => setMenuOpen(false)}
          />
          <div className="glass-strong absolute inset-y-0 left-0 w-[17rem] rounded-r-2xl">
            <Sidebar role={role} onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col">
        <Topbar
          role={role}
          onOpenMenu={() => setMenuOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}
