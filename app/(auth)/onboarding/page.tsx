'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Stethoscope, UserCheck, ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/brand/logo'
import { cn } from '@/lib/utils'

type SelectedRole = 'staff' | 'doctor' | 'patient' | null

export default function OnboardingPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<SelectedRole>(null)
  const [isNavigating, setIsNavigating] = useState(false)

  const handleContinue = () => {
    if (!selectedRole) return
    setIsNavigating(true)

    // Store selected role in cookie/localStorage if needed
    document.cookie = `remeet_role=${selectedRole === 'patient' ? 'staff' : selectedRole}; path=/; max-age=31536000`

    if (selectedRole === 'staff') {
      router.push('/dashboard')
    } else if (selectedRole === 'doctor') {
      router.push('/doctor-verification')
    } else if (selectedRole === 'patient') {
      router.push('/?patient_onboarded=true')
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 py-4">
      <div className="flex flex-col items-center text-center">
        <Wordmark className="text-2xl" />
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Welcome! Select your role
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Choose how you will be using reMeet Hospital system to set up your workspace.
        </p>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-3">
        {/* Front Desk Staff */}
        <button
          type="button"
          onClick={() => setSelectedRole('staff')}
          className={cn(
            'group relative flex flex-col items-center rounded-2xl border p-5 text-center transition-all duration-200 cursor-pointer',
            selectedRole === 'staff'
              ? 'border-accent bg-accent/10 shadow-lg shadow-accent/5 ring-2 ring-accent'
              : 'border-line bg-surface hover:border-accent/40 hover:bg-accent-soft/30',
          )}
        >
          <div
            className={cn(
              'grid size-12 place-items-center rounded-xl transition-colors',
              selectedRole === 'staff' ? 'bg-accent text-bg' : 'bg-accent-soft text-accent group-hover:bg-accent group-hover:text-bg',
            )}
          >
            <Building2 className="size-6" />
          </div>
          <h3 className="mt-3 font-display font-semibold text-ink">Front Desk</h3>
          <p className="mt-1 text-xs text-ink-soft">Hospital staff & reception desk flow</p>
          <span className="mt-3 inline-flex items-center text-xs font-medium text-accent">
            Instant Access
          </span>
        </button>

        {/* Doctor */}
        <button
          type="button"
          onClick={() => setSelectedRole('doctor')}
          className={cn(
            'group relative flex flex-col items-center rounded-2xl border p-5 text-center transition-all duration-200 cursor-pointer',
            selectedRole === 'doctor'
              ? 'border-accent bg-accent/10 shadow-lg shadow-accent/5 ring-2 ring-accent'
              : 'border-line bg-surface hover:border-accent/40 hover:bg-accent-soft/30',
          )}
        >
          <div
            className={cn(
              'grid size-12 place-items-center rounded-xl transition-colors',
              selectedRole === 'doctor' ? 'bg-accent text-bg' : 'bg-accent-soft text-accent group-hover:bg-accent group-hover:text-bg',
            )}
          >
            <Stethoscope className="size-6" />
          </div>
          <h3 className="mt-3 font-display font-semibold text-ink">Doctor</h3>
          <p className="mt-1 text-xs text-ink-soft">Clinical portal & patient consults</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-amber-500">
            <ShieldCheck className="size-3" /> Verification Req.
          </span>
        </button>

        {/* Patient */}
        <button
          type="button"
          onClick={() => setSelectedRole('patient')}
          className={cn(
            'group relative flex flex-col items-center rounded-2xl border p-5 text-center transition-all duration-200 cursor-pointer',
            selectedRole === 'patient'
              ? 'border-accent bg-accent/10 shadow-lg shadow-accent/5 ring-2 ring-accent'
              : 'border-line bg-surface hover:border-accent/40 hover:bg-accent-soft/30',
          )}
        >
          <div
            className={cn(
              'grid size-12 place-items-center rounded-xl transition-colors',
              selectedRole === 'patient' ? 'bg-accent text-bg' : 'bg-accent-soft text-accent group-hover:bg-accent group-hover:text-bg',
            )}
          >
            <UserCheck className="size-6" />
          </div>
          <h3 className="mt-3 font-display font-semibold text-ink">Patient</h3>
          <p className="mt-1 text-xs text-ink-soft">Book visits & view prescriptions</p>
          <span className="mt-3 inline-flex items-center text-xs font-medium text-accent">
            Landing Page
          </span>
        </button>
      </div>

      <Button
        size="lg"
        disabled={!selectedRole || isNavigating}
        onClick={handleContinue}
        className="w-full max-w-xs gap-2"
      >
        {isNavigating ? 'Proceeding...' : 'Continue'}
        <ArrowRight className="size-4" />
      </Button>
    </div>
  )
}
