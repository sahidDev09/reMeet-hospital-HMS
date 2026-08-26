'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import * as React from 'react'
import { cn } from '@/lib/utils'

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

/**
 * A three-way segmented control rather than a two-state toggle: "system" is a
 * real preference, and a toggle that silently overrides it is the reason people
 * end up with a light app on a dark desktop.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        'flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5',
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        // Before mount there is no known theme; nothing is marked active rather
        // than guessing and flipping on hydration.
        const active = mounted && theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              'grid size-7 cursor-pointer place-items-center rounded-[0.4rem] text-ink-faint transition-colors',
              'hover:text-ink',
              active && 'bg-surface-solid text-ink shadow-[0_1px_2px_rgb(16_19_28_/_0.08)]',
            )}
          >
            <Icon className="size-3.5" strokeWidth={2} />
          </button>
        )
      })}
    </div>
  )
}
