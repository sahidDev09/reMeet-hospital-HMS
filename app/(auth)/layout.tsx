import Link from 'next/link'
import { Wordmark } from '@/components/brand/logo'
import { PulseLine } from '@/components/brand/pulse-line'

/**
 * A quiet frame either side of Clerk's form. The pulse line runs behind it as an
 * ambient trace — the same motif as the hero, held to a whisper so the form is
 * unmistakably the thing to look at.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

