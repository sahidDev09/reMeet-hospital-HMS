'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Lock, Mail, KeyRound, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/brand/logo'
import { generateAdmin2FACode, verifyAdmin2FACode } from '@/lib/data/verifications'
import { sendAdmin2FAOtpEmail } from '@/lib/email'

export default function AdminLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials')

  // Step 1 states
  const [email, setEmail] = useState('iambotforwork72@gmail.com')
  const [password, setPassword] = useState('')

  // Step 2 states
  const [otp2fa, setOtp2fa] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [infoMsg, setInfoMsg] = useState('')

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate credentials
    if (email.trim() !== 'iambotforwork72@gmail.com' || password !== 'remeet2026') {
      setError('Invalid Admin credentials. Correct email is iambotforwork72@gmail.com and password is remeet2026.')
      return
    }

    setLoading(true)

    try {
      // Generate 2FA code
      const generatedOtp = await generateAdmin2FACode(email)
      
      // Send 2FA email via Resend
      await sendAdmin2FAOtpEmail(email, generatedOtp)

      setStep('2fa')
      setInfoMsg(`A 2FA verification code has been sent via Resend to ${email}. (Demo bypass code: 123456)`)
    } catch (err: unknown) {
      const errorObj = err as Error
      setError(errorObj.message || 'Failed to send 2FA code.')
    } finally {
      setLoading(false)
    }
  }

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp2fa) {
      setError('Please enter the 2FA code.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const isValid = await verifyAdmin2FACode(email, otp2fa)
      if (isValid) {
        // Set admin role & session
        await fetch('/api/auth/demo-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'admin' }),
        })
        document.cookie = 'remeet_role=admin; path=/; max-age=31536000'
        localStorage.setItem('remeet_onboarded', 'true')
        setInfoMsg('2FA verified! Redirecting to Admin Dashboard...')
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else {
        setError('Invalid 2FA code. Please check your email or use demo code 123456.')
      }
    } catch (err: unknown) {
      const errorObj = err as Error
      setError(errorObj.message || '2FA verification failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-xl">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="grid size-12 place-items-center rounded-xl bg-accent-soft text-accent">
          <ShieldCheck className="size-6" />
        </div>
        <Wordmark className="text-xl" />
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          {step === 'credentials' ? 'Administration Login' : '2FA Security Check'}
        </h1>
        <p className="text-xs text-ink-soft">
          {step === 'credentials'
            ? 'Restricted portal for reMeet system administrators'
            : 'Two-Factor Authentication required for Admin access'}
        </p>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-500 border border-rose-500/20">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {infoMsg ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-500 border border-emerald-500/20">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{infoMsg}</span>
        </div>
      ) : null}

      {step === 'credentials' ? (
        <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="adminEmail" className="text-xs font-medium text-ink">Admin Email</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 size-4 text-ink-faint" />
              <input
                id="adminEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-lg border border-line bg-bg pl-9 pr-3 text-sm text-ink outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="adminPassword" className="text-xs font-medium text-ink">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 size-4 text-ink-faint" />
              <input
                id="adminPassword"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-full rounded-lg border border-line bg-bg pl-9 pr-3 text-sm text-ink outline-none focus:border-accent"
              />
            </div>
            <span className="text-[0.6875rem] text-ink-faint">Default Password: <code className="text-accent font-mono">remeet2026</code></span>
          </div>

          <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full gap-2">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending 2FA Code...
              </>
            ) : (
              <>
                Continue to 2FA
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handle2FASubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="otp2faCode" className="text-xs font-medium text-ink">6-Digit 2FA Security Code</label>
            <div className="relative flex items-center">
              <KeyRound className="absolute left-3 size-4 text-ink-faint" />
              <input
                id="otp2faCode"
                type="text"
                maxLength={6}
                required
                placeholder="e.g. 123456"
                value={otp2fa}
                onChange={(e) => setOtp2fa(e.target.value)}
                className="h-12 w-full rounded-lg border border-line bg-bg pl-9 pr-3 font-mono text-xl tracking-[0.2em] font-semibold text-ink outline-none focus:border-accent text-center"
              />
            </div>
            <span className="text-[0.6875rem] text-ink-faint">Check email inbox for code or enter test code <code className="text-accent font-mono">123456</code></span>
          </div>

          <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full gap-2">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Verifying 2FA...
              </>
            ) : (
              <>
                Verify & Unlock Admin Dashboard
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>

          <button
            type="button"
            onClick={() => setStep('credentials')}
            className="text-center text-xs text-ink-soft hover:underline mt-1"
          >
            ← Back to Admin Login
          </button>
        </form>
      )}
    </div>
  )
}
