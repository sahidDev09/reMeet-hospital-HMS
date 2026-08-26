import { PulseLine } from '@/components/brand/pulse-line'
import { CountUp } from '@/components/motion/count-up'
import { Reveal } from '@/components/motion/reveal'
import { CURRENCY } from '@/lib/format'

/**
 * The numbers are read from the same data layer the dashboard uses, so this band
 * cannot quietly become marketing fiction while the product says something else.
 */
export function StatBand({
  patients,
  prescriptions,
  medicines,
  collectedThisMonth,
}: {
  patients: number
  prescriptions: number
  medicines: number
  collectedThisMonth: number
}) {
  const stats = [
    { label: 'Patient records', value: patients, suffix: '' },
    { label: 'Prescriptions issued', value: prescriptions, suffix: '' },
    { label: 'Medicines stocked', value: medicines, suffix: '' },
    {
      label: 'Collected this month',
      value: collectedThisMonth,
      prefix: `${CURRENCY.symbol} `,
    },
  ]

  return (
    <section className="border-y border-line bg-bg-deep/50">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <Reveal stagger className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} data-reveal className="flex flex-col gap-2">
              <CountUp
                value={stat.value}
                prefix={stat.prefix}
                onScroll
                className="font-display text-[2.25rem] font-semibold leading-none tracking-[-0.035em] text-ink tabular"
              />
              <PulseLine variant="rule" className="h-2 w-full max-w-24 text-accent/50" />
              <p className="text-sm text-ink-soft">{stat.label}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
