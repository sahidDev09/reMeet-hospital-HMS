'use client'

import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { NativeSelect, fieldBase } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Filters live in the URL, not in component state.
 *
 * That's a deliberate call: a filtered list is something staff send to each other
 * ("here's the overdue invoices"), reload, and reach back to with the browser's
 * back button. Local state breaks all three. It also keeps every list page a
 * server component — the filter is a query param the data layer already accepts.
 */
function useQueryWriter() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  return React.useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params.toString())
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === '') next.delete(key)
        else next.set(key, value)
      }
      // Any filter change invalidates the page you were on.
      if (!('page' in patch)) next.delete('page')
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [params, pathname, router],
  )
}

export function SearchField({
  param = 'q',
  placeholder = 'Search',
  className,
}: {
  param?: string
  placeholder?: string
  className?: string
}) {
  const params = useSearchParams()
  const write = useQueryWriter()
  const initial = params.get(param) ?? ''
  const [term, setTerm] = React.useState(initial)

  // Keep in step when the URL changes from elsewhere (back button, a cleared filter).
  React.useEffect(() => setTerm(initial), [initial])

  React.useEffect(() => {
    if (term === initial) return
    const timer = setTimeout(() => write({ [param]: term }), 220)
    return () => clearTimeout(timer)
  }, [term, initial, param, write])

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
      <input
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(fieldBase, 'h-10 pl-9 pr-9')}
      />
      {term ? (
        <button
          type="button"
          onClick={() => setTerm('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 grid size-5 -translate-y-1/2 cursor-pointer place-items-center rounded text-ink-faint hover:text-ink"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}

export function SelectFilter({
  param,
  label,
  allLabel,
  options,
  className,
}: {
  param: string
  label: string
  allLabel: string
  options: Array<{ value: string; label: string }>
  className?: string
}) {
  const params = useSearchParams()
  const write = useQueryWriter()

  return (
    <NativeSelect
      aria-label={label}
      value={params.get(param) ?? ''}
      onChange={(e) => write({ [param]: e.target.value })}
      className={cn('w-auto min-w-[9rem]', className)}
    >
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </NativeSelect>
  )
}

/** Clears every filter at once — the escape hatch when a list comes back empty. */
export function ClearFilters({ params: keys }: { params: string[] }) {
  const params = useSearchParams()
  const write = useQueryWriter()
  const active = keys.some((k) => params.get(k))

  if (!active) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => write(Object.fromEntries(keys.map((k) => [k, undefined])))}
    >
      Clear filters
    </Button>
  )
}

export function Pagination({
  page,
  pageSize,
  total,
  className,
}: {
  page: number
  pageSize: number
  total: number
  className?: string
}) {
  const write = useQueryWriter()
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null

  const first = (page - 1) * pageSize + 1
  const last = Math.min(total, page * pageSize)

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <p className="font-mono text-xs text-ink-faint">
        {first}–{last} of {total}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => write({ page: String(page - 1) })}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="px-1 font-mono text-xs text-ink-soft">
          {page} / {pages}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => write({ page: String(page + 1) })}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
