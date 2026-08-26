import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

/** yyyy-mm-dd for a Date, in local time — `toISOString` would shift by the offset. */
export function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

/** Parses `yyyy-mm` into a first-of-month Date, falling back to the current month. */
export function parseMonth(value?: string): Date {
  const match = value?.match(/^(\d{4})-(\d{2})$/)
  const now = new Date()
  if (!match) return new Date(now.getFullYear(), now.getMonth(), 1)
  return new Date(Number(match[1]), Number(match[2]) - 1, 1)
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * The month grid.
 *
 * Load is shown as a bar under the date rather than a badge with a number. Across
 * thirty cells the shape of the month is the useful signal — which Thursdays are
 * heavy, where the gaps are — and the exact count is one hover away. Cancelled
 * visits are already excluded upstream, so a light day here is genuinely light.
 *
 * No client JavaScript: every day is a link, so the month survives a refresh,
 * shares by URL, and works with the back button.
 */
export function MonthCalendar({
  month,
  selected,
  counts,
  basePath = '/appointments',
}: {
  month: Date
  selected: string
  counts: Record<string, number>
  basePath?: string
}) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const leading = new Date(year, monthIndex, 1).getDay()
  const busiest = Math.max(1, ...Object.values(counts))
  const todayKey = isoDay(new Date())

  const prev = monthKey(new Date(year, monthIndex - 1, 1))
  const next = monthKey(new Date(year, monthIndex + 1, 1))

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="font-display text-sm font-semibold tracking-tight text-ink">
          {month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </p>
        <div className="flex items-center gap-1">
          <Link
            href={`${basePath}?m=${prev}`}
            aria-label="Previous month"
            className="grid size-7 place-items-center rounded-md text-ink-soft transition-colors hover:bg-accent-soft hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            href={basePath}
            className="rounded-md px-2 py-1 text-xs font-medium text-ink-soft transition-colors hover:bg-accent-soft hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
          >
            Today
          </Link>
          <Link
            href={`${basePath}?m=${next}`}
            aria-label="Next month"
            className="grid size-7 place-items-center rounded-md text-ink-soft transition-colors hover:bg-accent-soft hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <span
            key={d}
            className="pb-1 text-center font-mono text-[0.625rem] font-medium tracking-[0.08em] text-ink-faint"
          >
            {d}
          </span>
        ))}

        {Array.from({ length: leading }, (_, i) => (
          <span key={`pad-${i}`} aria-hidden />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const count = counts[key] ?? 0
          const isSelected = key === selected
          const isToday = key === todayKey

          return (
            <Link
              key={key}
              href={`${basePath}?m=${monthKey(month)}&d=${key}`}
              aria-current={isSelected ? 'date' : undefined}
              title={count === 0 ? 'Nothing booked' : `${count} booked`}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25',
                isSelected
                  ? 'bg-accent text-accent-ink'
                  : 'text-ink hover:bg-accent-soft hover:text-accent',
                isToday && !isSelected && 'ring-1 ring-inset ring-accent/40',
              )}
            >
              <span className="font-mono text-xs tabular">{day}</span>
              <span
                aria-hidden
                className={cn(
                  'h-0.5 w-4 rounded-full',
                  count === 0
                    ? 'bg-transparent'
                    : isSelected
                      ? 'bg-accent-ink/70'
                      : 'bg-accent',
                )}
                style={
                  count === 0
                    ? undefined
                    : { width: `${0.5 + (count / busiest) * 1.1}rem` }
                }
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
