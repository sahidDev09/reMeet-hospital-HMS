'use client'

import { Command } from 'cmdk'
import { Pill, Stethoscope, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { globalSearch, type SearchHit } from '@/app/actions/search'
import { cn } from '@/lib/utils'

const GROUP_ICON = {
  Patients: User,
  Doctors: Stethoscope,
  Medicines: Pill,
} as const

const GROUP_ORDER: SearchHit['group'][] = ['Patients', 'Doctors', 'Medicines']

/**
 * Search that spans the records, because "find Rafiqul's file" is the single most
 * frequent thing anyone at a front desk does. Filtering is off on the cmdk side —
 * the server already ranked these, and re-filtering locally would hide matches
 * that came back on a field the label doesn't show.
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [term, setTerm] = React.useState('')
  const [hits, setHits] = React.useState<SearchHit[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const q = term.trim()
    if (q.length < 2) {
      setHits([])
      setLoading(false)
      return
    }

    setLoading(true)
    let cancelled = false
    // Debounced so typing a name doesn't fire a request per keystroke.
    const timer = setTimeout(async () => {
      const results = await globalSearch(q)
      if (cancelled) return
      setHits(results)
      setLoading(false)
    }, 160)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [term])

  function go(href: string) {
    onOpenChange(false)
    setTerm('')
    router.push(href)
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Search records"
      shouldFilter={false}
      className="fixed inset-0 z-50"
    >
      <div
        className="absolute inset-0 bg-ink/20 backdrop-blur-[2px]"
        onClick={() => onOpenChange(false)}
      />
      <div className="glass-strong absolute left-1/2 top-[12vh] w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl">
        <Command.Input
          value={term}
          onValueChange={setTerm}
          autoFocus
          placeholder="Search patients, doctors, medicines…"
          className="w-full border-b border-line bg-transparent px-4 py-3.5 text-sm text-ink outline-none placeholder:text-ink-faint"
        />

        <Command.List className="max-h-[min(24rem,60vh)] overflow-y-auto p-2">
          {term.trim().length < 2 ? (
            <p className="px-3 py-6 text-center text-sm text-ink-faint">
              Type at least two characters — a name, an MRN, a phone number, or a drug.
            </p>
          ) : loading ? (
            <p className="px-3 py-6 text-center text-sm text-ink-faint">Searching…</p>
          ) : hits.length === 0 ? (
            <Command.Empty className="px-3 py-6 text-center text-sm text-ink-faint">
              Nothing matches “{term.trim()}”. Check the spelling, or search by phone number.
            </Command.Empty>
          ) : (
            GROUP_ORDER.map((group) => {
              const rows = hits.filter((h) => h.group === group)
              if (rows.length === 0) return null
              const Icon = GROUP_ICON[group]
              return (
                <Command.Group
                  key={group}
                  heading={group}
                  className="[&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-ink-faint"
                >
                  {rows.map((hit) => (
                    <Command.Item
                      key={`${group}-${hit.id}`}
                      value={`${group}-${hit.id}`}
                      onSelect={() => go(hit.href)}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2',
                        'data-[selected=true]:bg-accent-soft data-[selected=true]:text-accent',
                      )}
                    >
                      <Icon className="size-4 shrink-0 text-ink-faint" strokeWidth={2} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink">{hit.title}</span>
                        <span className="block truncate font-mono text-[0.6875rem] text-ink-faint">
                          {hit.detail}
                        </span>
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )
            })
          )}
        </Command.List>
      </div>
    </Command.Dialog>
  )
}
