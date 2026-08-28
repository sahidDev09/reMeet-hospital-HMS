'use client'

import { Show } from '@clerk/nextjs'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { Wordmark } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '#departments', label: 'Departments' },
  { href: '#flow', label: 'How a visit works' },
  { href: '#doctors', label: 'Doctors' },
]

export function MarketingNav() {
  const [open, setOpen] = React.useState(false)
  const [lifted, setLifted] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-colors duration-300',
        lifted && 'border-b border-line bg-bg/75 backdrop-blur-xl',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg">
          <Wordmark className="text-xl" />
        </Link>

        <nav className="ml-auto hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-ink-soft transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Show when="signed-out">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </Show>
          <Show when="signed-in">
            <Button asChild size="sm">
              <Link href="/dashboard">Open reMeet</Link>
            </Button>
          </Show>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="grid size-9 cursor-pointer place-items-center rounded-lg text-ink-soft hover:bg-accent-soft md:hidden"
          >
            {open ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-line bg-bg/95 backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-5 py-2 sm:px-8">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-3 text-sm text-ink-soft last:border-0"
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="py-3 text-sm font-medium text-accent"
            >
              Sign in
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
