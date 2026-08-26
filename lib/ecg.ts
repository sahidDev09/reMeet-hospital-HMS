/**
 * ECG path geometry.
 *
 * This is the geometry behind reMeet's signature motif. One shape, reused as:
 * the hero trace, section rules, stat-card sparklines, and the print letterhead
 * rule. Kept framework-free so both server and client components can use it.
 */

/**
 * A single cardiac cycle in normalised space: x runs 0 → 1 across the beat,
 * y runs -1 (below baseline) → 1 (full spike). Sharp lines through the QRS
 * complex, sampled curves for the rounder P and T waves.
 */
const BEAT: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.12, 0],
  // P wave — atrial depolarisation, low and rounded
  [0.155, 0.06],
  [0.19, 0.15],
  [0.225, 0.06],
  [0.26, 0],
  [0.31, 0],
  // QRS complex — the spike. Deliberately angular.
  [0.335, -0.14],
  [0.365, 0.98],
  [0.4, -0.38],
  [0.435, 0],
  [0.52, 0],
  // T wave — repolarisation, broad and soft
  [0.58, 0.1],
  [0.65, 0.24],
  [0.72, 0.2],
  [0.79, 0.05],
  [0.84, 0],
  [1, 0],
]

function toPath(points: Array<[number, number]>): string {
  return points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ')
}

/**
 * A continuous trace of `beats` cardiac cycles.
 * `amplitude` scales the spike height (0–1 of the available half-height).
 */
export function ecgPath(width: number, height: number, beats = 3, amplitude = 0.82): string {
  const baseline = height / 2
  const scale = baseline * amplitude
  const beatWidth = width / beats
  const points: Array<[number, number]> = []

  for (let b = 0; b < beats; b++) {
    for (const [nx, ny] of BEAT) {
      // Skip the duplicated seam point between consecutive beats.
      if (b > 0 && nx === 0) continue
      points.push([b * beatWidth + nx * beatWidth, baseline - ny * scale])
    }
  }

  return toPath(points)
}

/**
 * A mostly-flat rule with a single beat at the midpoint — used as a section
 * divider and as the rule under the wordmark on printed sheets.
 */
export function rulePath(width: number, height: number, amplitude = 0.7): string {
  const baseline = height / 2
  const scale = baseline * amplitude
  const beatWidth = Math.min(width * 0.22, 120)
  const start = (width - beatWidth) / 2
  const points: Array<[number, number]> = [[0, baseline]]

  for (const [nx, ny] of BEAT) {
    points.push([start + nx * beatWidth, baseline - ny * scale])
  }

  points.push([width, baseline])
  return toPath(points)
}

/**
 * The same trace shape, but driven by real values — this is what turns the
 * motif into an actual sparkline on the dashboard stat cards rather than
 * decoration sitting next to one.
 */
export function sparkPath(values: number[], width: number, height: number, pad = 2): string {
  if (values.length === 0) return ''
  if (values.length === 1) {
    const mid = height / 2
    return `M0,${mid} L${width},${mid}`
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const usable = height - pad * 2

  const points = values.map((v, i): [number, number] => [
    (i / (values.length - 1)) * width,
    pad + (1 - (v - min) / span) * usable,
  ])

  return toPath(points)
}

/** Rough path length, so a draw-on animation can set stroke-dasharray without measuring in the DOM. */
export function approxLength(width: number, height: number) {
  return Math.round(width * 1.35 + height)
}
