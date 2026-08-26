'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { KeyRound, ShieldAlert, CheckCircle2, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/brand/logo'
import { verifyDoctorOtp, getVerificationByEmail } from '@/lib/data/verifications'

function DoctorOtpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  useEffect(() => {
    const initialEmail = searchParams.get('email')
    if (initialEmail) {
      setEmail(initialEmail)
      checkInitialStatus(initialEmail)
    }
  }, [searchParams])

  const checkInitialStatus = async (userEmail: string) => {
    const record = await getVerificationByEmail(userEmail)
    if (!record) {
      setStatusMsg({ type: 'info', text: 'Please enter your registered doctor email address.' })
    } else if (record.status === 'pending') {
      setStatusMsg({
        type: 'info',
        text: 'Your registration is currently under review by administration. Once approved, you will receive an email with your OTP code.',
      })
    } else if (record.status === 'approved') {
      setStatusMsg({
        type: 'success',
        text: 'Your account is approved! Enter the 6-digit OTP code sent to your email (valid for 2 days).',
      })
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !otp) {
      setStatusMsg({ type: 'error', text: 'Please enter your email and OTP code.' })
      return
    }

    setLoading(true)
    setStatusMsg(null)

    try {
      const res = await verifyDoctorOtp(email, otp)
      if (res.success) {
        setStatusMsg({ type: 'success', text: res.message })
        // Set doctor role cookie & redirect to /portal
        document.cookie = 'remeet_role=doctor; path=/; max-age=31536000'
        setTimeout(() => {
          router.push('/portal')
        }, 1200)
      } else {
        setStatusMsg({ type: 'error', text: res.message })
      }
    } catch (err: unknown) {
      const errorObj = err as Error
      setStatusMsg({ type: 'error', text: errorObj.message || 'Verification failed.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-xl">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="grid size-12 place-items-center rounded-xl bg-accent-soft text-accent">
          <KeyRound className="size-6" />
        </div>
        <Wordmark className="text-xl" />
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          Doctor OTP Verification
        </h1>
        <p className="text-xs text-ink-soft">
          Enter the 6-digit One-Time Password sent to your email after administration approval.
        </p>
      </div>

      {statusMsg ? (
        <div
          className={`flex items-start gap-2.5 rounded-xl p-3.5 text-xs border ${
            statusMsg.type === 'error'
              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
              : statusMsg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
          }`}
        >
          {statusMsg.type === 'error' ? (
            <ShieldAlert className="size-4 shrink-0 mt-0.5" />
          ) : statusMsg.type === 'success' ? (
            <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
          ) : (
            <KeyRound className="size-4 shrink-0 mt-0.5" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      ) : null}

      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="doctorEmail" className="text-xs font-medium text-ink">Registered Email Address</label>
          <input
            id="doctorEmail"
            type="email"
            required
            placeholder="dr.eleanor@remeet.health"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              checkInitialStatus(e.target.value)
            }}
            className="h-10 rounded-lg border border-line bg-bg px-3 text-sm text-ink outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="otpCode" className="text-xs font-medium text-ink">6-Digit OTP Code</label>
          <input
            id="otpCode"
            type="text"
            maxLength={6}
            required
            placeholder="e.g. 847291"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="h-12 rounded-lg border border-line bg-bg text-center font-mono text-xl tracking-[0.3em] font-semibold text-ink outline-none focus:border-accent"
          />
          <span className="text-[0.6875rem] text-ink-faint">OTP is valid within 2 days of approval</span>
        </div>

        <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full gap-2">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Verifying OTP...
            </>
          ) : (
            <>
              Unlock Doctor Dashboard
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}

export default function DoctorOtpPage() {
  return (
    <Suspense fallback={<div className="text-center p-8 text-sm text-ink-soft">Loading OTP verification...</div>}>
      <DoctorOtpContent />
    </Suspense>
  )
}
