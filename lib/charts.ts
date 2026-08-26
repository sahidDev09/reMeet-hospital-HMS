/**
 * Chart colours.
 *
 * The five `--chart-*` tokens are the only palette any chart draws from, and they
 * are read as CSS variables rather than hex so a chart follows the theme without
 * re-rendering: switching to dark swaps the variable, the SVG picks it up.
 *
 * Kept out of the client chart files on purpose — server pages render legends and
 * bar lists from the same values, and constants imported across a `'use client'`
 * boundary come back as client references rather than plain arrays.
 */
export const CHART_SERIES = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const

export function seriesColor(index: number) {
  return CHART_SERIES[index % CHART_SERIES.length]!
}

/**
 * A second lap through the palette is dimmed rather than repeated at full
 * strength, so the sixth department still reads as "further down the list"
 * instead of looking like the first one again.
 */
export function seriesOpacity(index: number) {
  return index < CHART_SERIES.length ? 1 : 0.55
}

/**
 * Appointment outcomes are the one split where colour carries meaning, so they
 * use the functional vitals: a finished consult is green, a no-show is red, and
 * everything still in motion is neutral blue.
 */
export const OUTCOME_COLOR: Record<string, string> = {
  Completed: 'var(--vital-ok)',
  Scheduled: 'var(--chart-1)',
  'Checked in': 'var(--chart-2)',
  'In consult': 'var(--chart-4)',
  Cancelled: 'var(--ink-faint)',
  'No show': 'var(--vital-crit)',
}

export function outcomeColor(label: string) {
  return OUTCOME_COLOR[label] ?? 'var(--ink-faint)'
}
