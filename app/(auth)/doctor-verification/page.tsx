'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Stethoscope, Upload, CheckCircle2, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/brand/logo'
import { createVerificationRequest } from '@/lib/data/verifications'
import { sendDoctorVerificationEmailToAdmin } from '@/lib/email'

export default function DoctorVerificationPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [designation, setDesignation] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [email, setEmail] = useState('')
  const [idImage, setIdImage] = useState<File | null>(null)
  const [idImagePreview, setIdImagePreview] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIdImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setIdImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !designation || !idNumber || !email) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create record in store
      await createVerificationRequest({
        fullName,
        designation,
        idNumber,
        email,
        idImageUrl: idImagePreview || undefined,
      })

      // Send email to admin via Resend
      await sendDoctorVerificationEmailToAdmin({
        fullName,
        designation,
        idNumber,
        email,
        idImageName: idImage ? idImage.name : undefined,
      })

      setSubmitted(true)
    } catch (err: unknown) {
      const errorObj = err as Error
      setError(errorObj.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 rounded-2xl border border-line bg-surface p-8 text-center shadow-xl">
        <div className="grid size-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-500 ring-8 ring-emerald-500/5">
          <CheckCircle2 className="size-8" />
        </div>

        <Wordmark className="text-xl" />

        <div className="flex flex-col gap-3">
          <h2 className="font-display text-2xl font-semibold text-ink">Verification Submitted</h2>
          <p className="text-sm leading-relaxed text-ink-soft bg-accent-soft/40 p-4 rounded-xl border border-accent/20">
            “Thank you for submitting your information. Our team is currently reviewing your details. Once approved, you will receive a confirmation email with further instructions. Please allow some time for verification.”
          </p>
        </div>

        <div className="flex flex-col w-full gap-3 pt-2">
          <Button asChild size="lg" className="w-full gap-2">
            <Link href={`/doctor-otp?email=${encodeURIComponent(email)}`}>
              Proceed to OTP Verification
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/onboarding">Back to Onboarding</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-xl">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="grid size-12 place-items-center rounded-xl bg-accent-soft text-accent">
          <Stethoscope className="size-6" />
        </div>
        <Wordmark className="text-xl" />
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          Doctor Verification Request
        </h1>
        <p className="text-xs text-ink-soft">
          Please provide your official identification details for administrative verification.
        </p>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-500 border border-rose-500/20">
          <ShieldAlert className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fullName" className="text-xs font-medium text-ink">Full Name</label>
          <input
            id="fullName"
            type="text"
            required
            placeholder="Dr. Eleanor Vance"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-10 rounded-lg border border-line bg-bg px-3 text-sm text-ink outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="designation" className="text-xs font-medium text-ink">Designation / Specialty</label>
          <input
            id="designation"
            type="text"
            required
            placeholder="Senior Cardiologist"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            className="h-10 rounded-lg border border-line bg-bg px-3 text-sm text-ink outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="idNumber" className="text-xs font-medium text-ink">Medical Council / ID Number</label>
          <input
            id="idNumber"
            type="text"
            required
            placeholder="BMDC-REG-84720"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            className="h-10 rounded-lg border border-line bg-bg px-3 text-sm text-ink outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-medium text-ink">Email Address (For Approval & OTP)</label>
          <input
            id="email"
            type="email"
            required
            placeholder="dr.eleanor@remeet.health"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 rounded-lg border border-line bg-bg px-3 text-sm text-ink outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="idImage" className="text-xs font-medium text-ink">ID Image Upload</label>
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-bg p-4 text-center hover:border-accent transition-colors">
            {idImagePreview ? (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={idImagePreview}
                  alt="ID Preview"
                  className="max-h-36 rounded-lg object-contain border border-line"
                />
                <span className="text-xs text-ink-soft">{idImage?.name}</span>
              </div>
            ) : (
              <label htmlFor="idImage" className="flex flex-col items-center gap-2 cursor-pointer">
                <Upload className="size-6 text-ink-faint" />
                <span className="text-xs font-medium text-accent">Click to upload ID photo or document</span>
                <span className="text-[0.6875rem] text-ink-faint">PNG, JPG, or PDF up to 5MB</span>
              </label>
            )}
            <input
              id="idImage"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        </div>

        <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full gap-2">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Submitting Verification...
            </>
          ) : (
            'Submit for Verification'
          )}
        </Button>
      </form>
    </div>
  )
}
