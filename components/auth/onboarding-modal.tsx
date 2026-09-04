'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import {
  Building2,
  Stethoscope,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  X,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  KeyRound,
  Lock,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/brand/logo'
import { cn } from '@/lib/utils'
import { createVerificationRequest, verifyDoctorOtp, generateAdmin2FACode, verifyAdmin2FACode } from '@/lib/data/verifications'
import { sendDoctorVerificationEmailToAdmin, sendAdmin2FAOtpEmail } from '@/lib/email'

export function OnboardingModal() {
  const { user, isAuthenticated, isLoading, switchRole } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<'roles' | 'doctor-form' | 'doctor-success' | 'doctor-otp' | 'admin-login' | 'admin-2fa'>('roles')
  const [selectedRole, setSelectedRole] = useState<'staff' | 'doctor' | 'patient' | 'admin' | null>(null)

  // Doctor Form State
  const [fullName, setFullName] = useState('')
  const [designation, setDesignation] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [email, setEmail] = useState('')
  const [idImage, setIdImage] = useState<File | null>(null)
  const [idImagePreview, setIdImagePreview] = useState<string | null>(null)

  // Doctor OTP State
  const [otp, setOtp] = useState('')

  // Admin Login State
  const [adminEmail, setAdminEmail] = useState('iambotforwork72@gmail.com')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminOtp, setAdminOtp] = useState('')

  // Loading & Error States
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [infoMsg, setInfoMsg] = useState('')

  useEffect(() => {
    if (!isLoading) {
      const forceOnboarding = searchParams.get('onboarding') === 'true'
      const hasOnboarded = typeof window !== 'undefined' ? localStorage.getItem('remeet_onboarded') : null
      const userEmail = user?.email?.toLowerCase()
      const isRoleAdmin = user?.role === 'admin'
      const isAdminUser = userEmail === 'iambotforwork72@gmail.com' || isRoleAdmin

      // If user is Admin, DO NOT show onboarding role selection modal unless forced
      if (isAdminUser && !forceOnboarding) {
        setIsOpen(false)
        return
      }

      // Automatically open modal when non-admin user signs in or signs up for first time, or if forceOnboarding is present
      if ((isAuthenticated && !hasOnboarded) || forceOnboarding) {
        setIsOpen(true)
        if (user?.email) {
          setEmail(user.email)
        }
        if (user?.name) {
          setFullName(user.name)
        }
      }
    }
  }, [isLoading, isAuthenticated, searchParams, user])

  // Allow triggering via window event if needed
  useEffect(() => {
    const handleOpenModal = () => setIsOpen(true)
    window.addEventListener('open-onboarding-modal', handleOpenModal)
    return () => window.removeEventListener('open-onboarding-modal', handleOpenModal)
  }, [])

  if (!isOpen) return null

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('remeet_onboarded', 'true')
  }

  // --- Role Submit Handler ---
  const handleRoleSubmit = async () => {
    if (!selectedRole) return

    if (selectedRole === 'admin') {
      setView('admin-login')
      return
    }

    if (selectedRole === 'doctor') {
      setView('doctor-form')
      return
    }

    localStorage.setItem('remeet_onboarded', 'true')

    if (selectedRole === 'staff') {
      document.cookie = 'remeet_role=staff; path=/; max-age=31536000'
      await switchRole('staff')
      handleClose()
      router.push('/dashboard')
    } else if (selectedRole === 'patient') {
      document.cookie = 'remeet_role=staff; path=/; max-age=31536000'
      await switchRole('staff')
      handleClose()
      router.push('/patient')
    }
  }

  // --- Doctor Verification Submit Handler ---
  const handleDoctorFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !designation || !idNumber || !email) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await createVerificationRequest({
        fullName,
        designation,
        idNumber,
        email,
        idImageUrl: idImagePreview || undefined,
      })

      await sendDoctorVerificationEmailToAdmin({
        fullName,
        designation,
        idNumber,
        email,
        idImageName: idImage?.name,
      })

      setView('doctor-success')
    } catch (err: unknown) {
      const errorObj = err as Error
      setError(errorObj.message || 'Verification submission failed.')
    } finally {
      setLoading(false)
    }
  }

  // --- Doctor OTP Verification Handler ---
  const handleDoctorOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !otp) {
      setError('Please enter your email and OTP code.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await verifyDoctorOtp(email, otp)
      if (res.success) {
        setInfoMsg(res.message)
        document.cookie = 'remeet_role=doctor; path=/; max-age=31536000'
        await switchRole('doctor')
        setTimeout(() => {
          handleClose()
          router.push('/portal')
        }, 1200)
      } else {
        setError(res.message)
      }
    } catch (err: unknown) {
      const errorObj = err as Error
      setError(errorObj.message || 'OTP verification failed.')
    } finally {
      setLoading(false)
    }
  }

  // --- Admin Login & 2FA Handler ---
  const handleAdminCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (adminEmail.trim() !== 'iambotforwork72@gmail.com' || adminPassword !== 'remeet2026') {
      setError('Invalid Admin credentials. (Email: iambotforwork72@gmail.com, Password: remeet2026)')
      return
    }

    setLoading(true)
    setError('')

    try {
      const generatedOtp = await generateAdmin2FACode(adminEmail)
      await sendAdmin2FAOtpEmail(adminEmail, generatedOtp)

      setView('admin-2fa')
      setInfoMsg(`2FA code sent via Resend to ${adminEmail}. (Demo bypass: 123456)`)
    } catch (err: unknown) {
      const errorObj = err as Error
      setError(errorObj.message || 'Failed to send 2FA code.')
    } finally {
      setLoading(false)
    }
  }

  const handleAdmin2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminOtp) {
      setError('Please enter your 2FA code.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const isValid = await verifyAdmin2FACode(adminEmail, adminOtp)
      if (isValid) {
        document.cookie = 'remeet_role=admin; path=/; max-age=31536000'
        await switchRole('admin')
        setInfoMsg('2FA verified! Unlocking Admin Dashboard...')
        setTimeout(() => {
          handleClose()
          router.push('/dashboard')
        }, 1000)
      } else {
        setError('Invalid 2FA code. Please check your email or use test code 123456.')
      }
    } catch (err: unknown) {
      const errorObj = err as Error
      setError(errorObj.message || '2FA verification failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-ink-soft hover:bg-accent-soft hover:text-ink transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <Wordmark className="text-2xl" />
          {view === 'roles' ? (
            <>
              <h2 className="font-display text-2xl font-semibold text-ink">Welcome! Select your role</h2>
              <p className="text-xs text-ink-soft">Choose how you will be using the reMeet Hospital system.</p>
            </>
          ) : view === 'doctor-form' ? (
            <>
              <h2 className="font-display text-2xl font-semibold text-ink">Doctor Verification Request</h2>
              <p className="text-xs text-ink-soft">Provide official identification for administrative verification.</p>
            </>
          ) : view === 'doctor-success' ? (
            <>
              <h2 className="font-display text-2xl font-semibold text-ink">Verification Details Submitted</h2>
            </>
          ) : view === 'doctor-otp' ? (
            <>
              <h2 className="font-display text-2xl font-semibold text-ink">Doctor OTP Verification</h2>
              <p className="text-xs text-ink-soft">Enter the 6-digit OTP code sent to your email after approval.</p>
            </>
          ) : view === 'admin-login' ? (
            <>
              <h2 className="font-display text-2xl font-semibold text-ink">Admin Authentication</h2>
              <p className="text-xs text-ink-soft">Restricted portal for system administrators</p>
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl font-semibold text-ink">Admin 2FA Security Check</h2>
              <p className="text-xs text-ink-soft">Enter 2FA security code delivered via Resend</p>
            </>
          )}
        </div>

        {/* Feedback Notices */}
        {error ? (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-500 border border-rose-500/20">
            <ShieldAlert className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {infoMsg ? (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{infoMsg}</span>
          </div>
        ) : null}

        {/* VIEW 1: Role Selection Grid (All 4 Roles) */}
        {view === 'roles' ? (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('staff')}
                className={cn(
                  'group flex flex-col items-center rounded-2xl border p-4 text-center transition-all cursor-pointer',
                  selectedRole === 'staff'
                    ? 'border-accent bg-accent/10 shadow-md ring-2 ring-accent'
                    : 'border-line bg-bg hover:border-accent/40',
                )}
              >
                <div className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent group-hover:bg-accent group-hover:text-bg transition-colors">
                  <Building2 className="size-5" />
                </div>
                <h3 className="mt-2 text-sm font-semibold text-ink">Front Desk</h3>
                <p className="text-[0.6875rem] text-ink-soft mt-0.5">Staff & triage reception</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('doctor')}
                className={cn(
                  'group flex flex-col items-center rounded-2xl border p-4 text-center transition-all cursor-pointer',
                  selectedRole === 'doctor'
                    ? 'border-accent bg-accent/10 shadow-md ring-2 ring-accent'
                    : 'border-line bg-bg hover:border-accent/40',
                )}
              >
                <div className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent group-hover:bg-accent group-hover:text-bg transition-colors">
                  <Stethoscope className="size-5" />
                </div>
                <h3 className="mt-2 text-sm font-semibold text-ink">Doctor</h3>
                <p className="text-[0.6875rem] text-ink-soft mt-0.5">Doctor portal & consults</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('patient')}
                className={cn(
                  'group flex flex-col items-center rounded-2xl border p-4 text-center transition-all cursor-pointer',
                  selectedRole === 'patient'
                    ? 'border-accent bg-accent/10 shadow-md ring-2 ring-accent'
                    : 'border-line bg-bg hover:border-accent/40',
                )}
              >
                <div className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent group-hover:bg-accent group-hover:text-bg transition-colors">
                  <UserCheck className="size-5" />
                </div>
                <h3 className="mt-2 text-sm font-semibold text-ink">Patient</h3>
                <p className="text-[0.6875rem] text-ink-soft mt-0.5">Bookings & prescriptions</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={cn(
                  'group flex flex-col items-center rounded-2xl border p-4 text-center transition-all cursor-pointer',
                  selectedRole === 'admin'
                    ? 'border-accent bg-accent/10 shadow-md ring-2 ring-accent'
                    : 'border-line bg-bg hover:border-accent/40',
                )}
              >
                <div className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent group-hover:bg-accent group-hover:text-bg transition-colors">
                  <ShieldCheck className="size-5" />
                </div>
                <h3 className="mt-2 text-sm font-semibold text-ink">Administrator</h3>
                <p className="text-[0.6875rem] text-ink-soft mt-0.5">Hospital control & 2FA</p>
              </button>
            </div>

            <Button
              size="lg"
              disabled={!selectedRole}
              onClick={handleRoleSubmit}
              className="w-full gap-2 mt-2"
            >
              Continue with {selectedRole ? (selectedRole === 'admin' ? 'Administrator' : selectedRole.toUpperCase()) : 'Selected Role'}{' '}
              <ArrowRight className="size-4" />
            </Button>

            <div className="flex items-center justify-between border-t border-line pt-3 text-xs text-ink-faint">
              <button
                type="button"
                onClick={() => setView('admin-login')}
                className="text-accent hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="size-3.5" /> Direct Admin 2FA Login
              </button>
              <button
                type="button"
                onClick={() => setView('doctor-otp')}
                className="text-ink-soft hover:text-ink flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="size-3.5" /> Enter Doctor OTP
              </button>
            </div>
          </div>
        ) : null}

        {/* VIEW 2: Doctor Verification Form */}
        {view === 'doctor-form' ? (
          <form onSubmit={handleDoctorFormSubmit} className="flex flex-col gap-3 text-left">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink">Full Name</label>
              <input
                type="text"
                required
                placeholder="Dr. Eleanor Vance"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-9 rounded-lg border border-line bg-bg px-3 text-xs text-ink outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink">Designation</label>
              <input
                type="text"
                required
                placeholder="Senior Cardiologist"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="h-9 rounded-lg border border-line bg-bg px-3 text-xs text-ink outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink">ID Number</label>
              <input
                type="text"
                required
                placeholder="BMDC-REG-84720"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="h-9 rounded-lg border border-line bg-bg px-3 text-xs text-ink outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink">Email</label>
              <input
                type="email"
                required
                placeholder="dr.eleanor@remeet.health"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 rounded-lg border border-line bg-bg px-3 text-xs text-ink outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink">Upload ID Document / Photo</label>
              <div className="flex items-center justify-between rounded-lg border border-dashed border-line bg-bg p-2 px-3 text-xs">
                <span className="text-ink-soft truncate max-w-[200px]">
                  {idImage ? idImage.name : 'Select ID image file'}
                </span>
                <label className="text-accent hover:underline cursor-pointer font-medium">
                  Browse
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setIdImage(file)
                        const reader = new FileReader()
                        reader.onloadend = () => setIdImagePreview(reader.result as string)
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setView('roles')} className="w-1/3">
                Back
              </Button>
              <Button type="submit" size="sm" disabled={loading} className="w-2/3 gap-2">
                {loading ? <Loader2 className="size-4 animate-spin" /> : 'Submit Verification'}
              </Button>
            </div>
          </form>
        ) : null}

        {/* VIEW 3: Doctor Submission Success */}
        {view === 'doctor-success' ? (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="grid size-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="size-6" />
            </div>
            <p className="text-xs leading-relaxed text-ink-soft bg-accent-soft/40 p-4 rounded-xl border border-accent/20">
              “Thank you for submitting your information. Our team is currently reviewing your details. Once approved, you will receive a confirmation email with further instructions. Please allow some time for verification.”
            </p>
            <Button size="sm" onClick={() => setView('doctor-otp')} className="w-full gap-2">
              Enter Approved OTP <ArrowRight className="size-4" />
            </Button>
          </div>
        ) : null}

        {/* VIEW 4: Doctor OTP Verification */}
        {view === 'doctor-otp' ? (
          <form onSubmit={handleDoctorOtpSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-medium text-ink">Registered Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dr.eleanor@remeet.health"
                className="h-9 rounded-lg border border-line bg-bg px-3 text-xs text-ink outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-medium text-ink">6-Digit OTP Code</label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="847291"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="h-11 text-center font-mono text-lg font-bold tracking-[0.2em] rounded-lg border border-line bg-bg px-3 text-ink outline-none focus:border-accent"
              />
              <span className="text-[0.6875rem] text-ink-faint">OTP is valid within 2 days of administration approval</span>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setView('roles')} className="w-1/3">
                Back
              </Button>
              <Button type="submit" size="sm" disabled={loading} className="w-2/3 gap-2">
                {loading ? <Loader2 className="size-4 animate-spin" /> : 'Unlock Doctor Portal'}
              </Button>
            </div>
          </form>
        ) : null}

        {/* VIEW 5: Admin Login */}
        {view === 'admin-login' ? (
          <form onSubmit={handleAdminCredentialsSubmit} className="flex flex-col gap-3 text-left">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink">Admin Email</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 size-3.5 text-ink-faint" />
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="h-9 w-full rounded-lg border border-line bg-bg pl-8 pr-3 text-xs text-ink outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink">Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 size-3.5 text-ink-faint" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="h-9 w-full rounded-lg border border-line bg-bg pl-8 pr-3 text-xs text-ink outline-none focus:border-accent"
                />
              </div>
              <span className="text-[0.6875rem] text-ink-faint">Password: <code className="text-accent font-mono">remeet2026</code></span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setView('roles')} className="w-1/3">
                Back
              </Button>
              <Button type="submit" size="sm" disabled={loading} className="w-2/3 gap-2">
                {loading ? <Loader2 className="size-4 animate-spin" /> : 'Send 2FA Code'}
              </Button>
            </div>
          </form>
        ) : null}

        {/* VIEW 6: Admin 2FA */}
        {view === 'admin-2fa' ? (
          <form onSubmit={handleAdmin2FASubmit} className="flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink">6-Digit 2FA Security Code</label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={adminOtp}
                onChange={(e) => setAdminOtp(e.target.value)}
                className="h-11 text-center font-mono text-lg font-bold tracking-[0.2em] rounded-lg border border-line bg-bg px-3 text-ink outline-none focus:border-accent"
              />
              <span className="text-[0.6875rem] text-ink-faint">Check email or enter test code <code className="text-accent font-mono">123456</code></span>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setView('admin-login')} className="w-1/3">
                Back
              </Button>
              <Button type="submit" size="sm" disabled={loading} className="w-2/3 gap-2">
                {loading ? <Loader2 className="size-4 animate-spin" /> : 'Unlock Admin Dashboard'}
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  )
}
