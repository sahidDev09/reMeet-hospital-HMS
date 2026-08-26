import Link from 'next/link'
import { Wordmark } from '@/components/brand/logo'
import { PulseLine } from '@/components/brand/pulse-line'

/**
 * A quiet frame either side of Clerk's form. The pulse line runs behind it as an
 * ambient trace — the same motif as the hero, held to a whisper so the form is
 * unmistakably the thing to look at.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-[0.07]"
      >
        <PulseLine variant="hero" beats={5} strokeWidth={1.5} className="h-52 w-full" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-accent/12 blur-[120px]"
      />

      <div className="relative flex w-full max-w-sm flex-col items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg">
          <Wordmark className="text-xl" />
        </Link>

        {children}

        <p className="text-center text-xs text-ink-faint">
          Protected clinical system. Access is logged.
        </p>
      </div>
    </div>
  )
}
