'use client'

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS, ChartShell, GRID, glassTooltip } from '@/components/charts/chart-shell'
import { seriesColor, seriesOpacity } from '@/lib/charts'
import { compact, money, num, percent } from '@/lib/format'
import type { DepartmentCode, SeriesPoint } from '@/lib/data/types'

/* --- Revenue -------------------------------------------------------------- */

/**
 * Money collected per day.
 *
 * A flat low-opacity fill rather than a gradient: the design system spends its
 * one gradient on the hero, and a solid tint reads the value of the area just as
 * well at this size.
 */
export function RevenueArea({ data }: { data: SeriesPoint[] }) {
  return (
    <ChartShell height={252}>
      {({ animate }) => (
        <AreaChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="label" {...AXIS} interval="preserveStartEnd" minTickGap={28} />
          <YAxis {...AXIS} width={44} tickFormatter={compact} />
          <Tooltip
            content={glassTooltip(money)}
            cursor={{ stroke: 'var(--line-strong)', strokeWidth: 1 }}
            wrapperStyle={{ outline: 'none' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            name="Collected"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="var(--chart-1)"
            fillOpacity={0.12}
            dot={false}
            activeDot={{ r: 3.5, strokeWidth: 0, fill: 'var(--chart-1)' }}
            isAnimationActive={animate}
          />
        </AreaChart>
      )}
    </ChartShell>
  )
}

/**
 * Consultations and labs against the pharmacy counter, stacked.
 *
 * Stacked rather than side by side because the question staff actually ask is
 * "what did the clinic take that day, and how much of it was drugs" — the total
 * has to be readable as one bar.
 */
export function StreamBars({
  data,
}: {
  data: Array<{ label: string; clinical: number; pharmacy: number }>
}) {
  return (
    <ChartShell height={236}>
      {({ animate }) => (
        <BarChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: 0 }} barCategoryGap="22%">
          <CartesianGrid {...GRID} />
          <XAxis dataKey="label" {...AXIS} interval="preserveStartEnd" minTickGap={20} />
          <YAxis {...AXIS} width={44} tickFormatter={compact} />
          <Tooltip
            content={glassTooltip(money)}
            cursor={{ fill: 'var(--accent-soft)' }}
            wrapperStyle={{ outline: 'none' }}
          />
          <Bar
            dataKey="clinical"
            stackId="revenue"
            name="Consultations & labs"
            fill="var(--chart-1)"
            isAnimationActive={animate}
          />
          <Bar
            dataKey="pharmacy"
            stackId="revenue"
            name="Pharmacy"
            fill="var(--chart-3)"
            radius={[3, 3, 0, 0]}
            isAnimationActive={animate}
          />
        </BarChart>
      )}
    </ChartShell>
  )
}

/* --- Visits --------------------------------------------------------------- */

export function VisitBars({ data }: { data: SeriesPoint[] }) {
  return (
    <ChartShell height={236}>
      {({ animate }) => (
        <BarChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: 0 }} barCategoryGap="26%">
          <CartesianGrid {...GRID} />
          <XAxis dataKey="label" {...AXIS} interval={0} minTickGap={0} />
          <YAxis {...AXIS} width={30} allowDecimals={false} />
          <Tooltip
            content={glassTooltip((value) => `${num(value)} visits`)}
            cursor={{ fill: 'var(--accent-soft)' }}
            wrapperStyle={{ outline: 'none' }}
          />
          <Bar
            dataKey="value"
            name="Booked visits"
            fill="var(--chart-2)"
            radius={[3, 3, 0, 0]}
            isAnimationActive={animate}
          />
        </BarChart>
      )}
    </ChartShell>
  )
}

/* --- Departments ---------------------------------------------------------- */

/**
 * Share of visits by department.
 *
 * The ring carries the proportions and the list underneath carries the numbers,
 * so nothing depends on reading an angle. Department codes lead the legend for
 * the same reason they lead every other list in the app: `CARD` is what's written
 * on the chart and the door.
 */
export function DepartmentDonut({
  data,
}: {
  data: Array<SeriesPoint & { code: DepartmentCode }>
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <ChartShell height={196} className="ml-0">
          {({ animate }) => (
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Tooltip
                content={glassTooltip((value) => `${num(value)} visits`)}
                wrapperStyle={{ outline: 'none' }}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius="62%"
                outerRadius="88%"
                paddingAngle={2}
                stroke="var(--surface-solid)"
                strokeWidth={2}
                isAnimationActive={animate}
              >
                {data.map((dept, i) => (
                  <Cell key={dept.code} fill={seriesColor(i)} fillOpacity={seriesOpacity(i)} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ChartShell>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-semibold tracking-[-0.03em] tabular text-ink">
            {num(total)}
          </span>
          <span className="eyebrow text-ink-faint">visits</span>
        </div>
      </div>

      <ul className="flex flex-col gap-1.5">
        {data.map((dept, i) => (
          <li key={dept.code} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ background: seriesColor(i), opacity: seriesOpacity(i) }}
              />
              <span className="font-mono text-[0.625rem] font-semibold tracking-[0.08em] text-ink-faint">
                {dept.code}
              </span>
              <span className="truncate text-ink-soft">{dept.label}</span>
            </span>
            <span className="shrink-0 font-mono text-xs tabular text-ink">
              {num(dept.value)}
              <span className="ml-1.5 text-ink-faint">
                {percent(total === 0 ? 0 : (dept.value / total) * 100)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
