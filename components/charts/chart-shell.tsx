'use client'

import * as React from 'react'
import { ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

/* --- Shared chart chrome -------------------------------------------------- */

/** Axis text: mono, faint, no rules. The grid does the measuring, not the axis. */
export const AXIS = {
  tickLine: false,
  axisLine: false,
  tick: { fill: 'var(--ink-faint)', fontSize: 11 },
} as const

export const GRID = {
  stroke: 'var(--line)',
  strokeDasharray: '2 4',
  vertical: false,
} as const

type TipRow = { name?: string; value?: number | string; color?: string; dataKey?: string | number }
type TipInput = { active?: boolean; label?: string | number; payload?: TipRow[] }

/**
 * Tooltips as a frosted card, matching every other surface in the app.
 *
 * Recharts injects its props at runtime, and their generic shape has churned
 * across versions, so the argument is taken as `unknown` and narrowed to the few
 * fields actually used. A function passed to `content` is assignable whatever the
 * library's own prop type happens to be.
 */
export function glassTooltip(format: (value: number) => string) {
  return function GlassTooltip(raw: unknown) {
    const { active, label, payload } = (raw ?? {}) as TipInput
    if (!active || !payload?.length) return null

    return (
      <div className="rounded-lg border border-line bg-surface-solid px-3 py-2 shadow-lift">
        {label !== undefined ? (
          <p className="mb-1 font-mono text-[0.625rem] uppercase tracking-[0.08em] text-ink-faint">
            {label}
          </p>
        ) : null}
        <ul className="flex flex-col gap-0.5">
          {payload.map((row, i) => (
            <li key={i} className="flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-ink-soft">
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: row.color }}
                />
                {row.name ?? 'Value'}
              </span>
              <span className="font-mono font-medium tabular text-ink">
                {format(Number(row.value ?? 0))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )
  }
}

/* --- The shell ------------------------------------------------------------ */

/**
 * Every chart waits for mount behind a placeholder of exactly its final height.
 *
 * Recharts measures its parent to size the SVG, and on the server there is
 * nothing to measure — rendering it there produces a zero-width chart and a
 * console warning. Holding the space means the page never jumps when the real
 * chart arrives.
 *
 * The same gate reads `prefers-reduced-motion` and hands `animate` down, because
 * bars that grow out of the axis are exactly what someone who asked for less
 * motion doesn't want. The numbers are identical either way.
 */
export function ChartShell({
  height = 240,
  className,
  children,
}: {
  height?: number
  className?: string
  children: (state: { animate: boolean }) => React.ReactElement
}) {
  const [state, setState] = React.useState({ mounted: false, animate: false })

  React.useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setState({ mounted: true, animate: !query.matches })
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  if (!state.mounted) {
    return <div aria-hidden style={{ height }} className={cn('rounded-xl bg-line', className)} />
  }

  return (
    <div style={{ height }} className={cn('-ml-1.5', className)}>
      <ResponsiveContainer width="100%" height="100%">
        {children({ animate: state.animate })}
      </ResponsiveContainer>
    </div>
  )
}
