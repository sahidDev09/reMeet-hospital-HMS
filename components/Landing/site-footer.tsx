import { ArrowRight, Clock, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'
import { Wordmark } from '@/components/brand/logo'
import { PulseLine } from '@/components/brand/pulse-line'
import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'
import { CLINIC } from '@/components/app/print-sheet'

const COLUMNS = [
  {
    heading: 'Clinical',
    links: [
      { href: '/appointments', label: 'Appointments' },
      { href: '/patients', label: 'Patients' },
      { href: '/prescriptions', label: 'Prescriptions' },
      { href: '/portal', label: 'Doctor portal' },
    ],
  },
  {
    heading: 'Counter',
    links: [
      { href: '/pharmacy', label: 'Pharmacy' },
      { href: '/pos', label: 'Point of sale' },
      { href: '/billing', label: 'Billing' },
      { href: '/analytics', label: 'Analytics' },
    ],
  },
]

export function SiteFooter() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-4 sm:px-8 sm:pb-24">
        <Reveal className="glass relative overflow-hidden rounded-2xl px-6 py-12 text-center sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 opacity-[0.12]"
          >
            <PulseLine variant="hero" beats={3} className="h-28 w-full" />
          </div>
          <div className="relative flex flex-col items-center gap-5">
            <h2 className="max-w-lg font-display text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-[2.5rem]">
              Put the whole visit in one place.
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-ink-soft">
              Sign in to walk the system as an administrator, a doctor, or the front desk.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Get started
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-3">
              <Link href="/" className="flex items-center gap-2.5">
                <Wordmark className="text-lg" />
              </Link>
              <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
                Hospital management, point of sale, and prescriptions on one record.
              </p>
            </div>

            {COLUMNS.map((col) => (
              <div key={col.heading} className="flex flex-col gap-2.5">
                <p className="eyebrow text-ink-faint">{col.heading}</p>
                {col.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-ink-soft transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}

            <div className="flex flex-col gap-2.5">
              <p className="eyebrow text-ink-faint">Visit</p>
              <p className="flex items-start gap-2 text-sm text-ink-soft">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-faint" />
                {CLINIC.address}
              </p>
              <p className="flex items-center gap-2 text-sm text-ink-soft">
                <Phone className="size-3.5 shrink-0 text-ink-faint" />
                <span className="font-mono text-xs">{CLINIC.phone}</span>
              </p>
              <p className="flex items-center gap-2 text-sm text-ink-soft">
                <Clock className="size-3.5 shrink-0 text-ink-faint" />
                Sat–Thu, 8:00 am – 9:00 pm
              </p>
            </div>
          </div>

          <PulseLine variant="rule" className="mt-10 h-3 w-full text-line-strong" />

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[0.6875rem] text-ink-faint">
              {CLINIC.licence} · © {new Date().getFullYear()} reMeet Hospital
            </p>
            <p className="font-mono text-[0.6875rem] text-ink-faint">
              Emergency: <span className="text-vital-crit">999</span>
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
