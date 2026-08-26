/**
 * Shared plumbing for the mock data layer.
 *
 * The fixtures are module-level arrays, which means writes survive within a
 * server process but reset on restart. That is deliberate and documented — the
 * point of this layer is that the *signatures* are already correct, so wiring a
 * real database means rewriting function bodies and nothing else.
 */

/** Deep clone so callers can't mutate the fixtures by holding a reference. */
export function clone<T>(value: T): T {
  return structuredClone(value)
}

/**
 * A small artificial delay. Not for realism theatre — it means loading states,
 * Suspense boundaries, and skeletons get exercised during development instead of
 * only appearing once a real network is in front of them.
 */
export function delay(ms = 90): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Case-insensitive "does any of these fields contain the term" test. */
export function matches(term: string | undefined, ...fields: Array<string | undefined>) {
  if (!term) return true
  const t = term.trim().toLowerCase()
  if (!t) return true
  return fields.some((f) => f?.toLowerCase().includes(t))
}

export function paginate<T>(items: T[], page = 1, pageSize = 12) {
  const safePage = Math.max(1, page)
  const start = (safePage - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page: safePage,
    pageSize,
  }
}

/** Sequence generator for ids created at runtime. */
export function nextId(prefix: string, existing: Array<{ id: string }>) {
  const max = existing.reduce((m, r) => {
    const n = Number(r.id.split('_')[1])
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return `${prefix}_${String(max + 1).padStart(2, '0')}`
}
