'use client'

import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  Mail,
  UserCheck,
  Loader2,
  Clock,
  AlertCircle,
  Stethoscope,
  Building2,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getVerificationRequests, approveVerificationRequest } from '@/lib/data/verifications'
import type { DoctorVerificationRequest } from '@/lib/data/types'
import { sendDoctorApprovalOtpEmail } from '@/lib/email'
import { useAuth } from '@/lib/auth/context'
import { useRouter } from 'next/navigation'
import { homeFor } from '@/lib/auth/role-meta'

export default function AdminVerificationsPage() {
  const { role, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<DoctorVerificationRequest[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'doctor' | 'staff'>('all')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace('/sign-in?redirect=/admin/verifications')
      } else if (role !== 'admin') {
        router.replace(homeFor(role))
      } else {
        fetchRequests()
      }
    }
  }, [authLoading, isAuthenticated, role, router])

  const fetchRequests = async () => {
    setLoading(true)
    const data = await getVerificationRequests()
    setRequests([...data])
    setLoading(false)
  }

  if (authLoading || !isAuthenticated || role !== 'admin') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-ink-soft">
          <div className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-xs">Verifying administrator authorization...</p>
        </div>
      </div>
    )
  }

  const handleApprove = async (req: DoctorVerificationRequest) => {
    setActionLoading(req.id)
    setNotification(null)

    try {
      const res = await approveVerificationRequest(req.id)
      if (res) {
        // Send email with OTP via Resend
        try {
          await sendDoctorApprovalOtpEmail(res.request.email, res.request.fullName, res.otp)
        } catch {
          // Email dispatch error shouldn't block local approval
        }

        const isDoc = req.role !== 'staff'
        const roleTitle = isDoc ? `Dr. ${res.request.fullName}` : `Staff Member ${res.request.fullName}`
        setNotification(
          `${roleTitle} has been approved! OTP code (${res.otp}) generated (valid 2 days) and activated for access.`,
        )
        fetchRequests()
      }
    } catch (err: unknown) {
      const errorObj = err as Error
      setNotification(`Failed to approve: ${errorObj.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'all') return true
    if (activeTab === 'doctor') return r.role !== 'staff'
    if (activeTab === 'staff') return r.role === 'staff'
    return true
  })

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-6 text-accent" />
            <h1 className="font-display text-2xl font-semibold text-ink">
              Staff &amp; Doctor Verification Management
            </h1>
          </div>
          <p className="text-sm text-ink-soft mt-1">
            Review and approve clinical doctors and front desk staff (&ldquo;decks&rdquo;) credentials to unlock their access.
          </p>
        </div>
        <div className="mt-2 sm:mt-0 font-mono text-xs text-ink-faint bg-surface border border-line px-3 py-1.5 rounded-lg">
          Administrator: <span className="text-accent font-semibold">admin@remeet.health</span>
        </div>
      </div>

      {notification ? (
        <div className="flex items-start gap-3 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-500 border border-emerald-500/20">
          <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
          <span>{notification}</span>
        </div>
      ) : null}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'bg-accent text-bg shadow-sm'
              : 'text-ink-soft hover:bg-surface hover:text-ink'
          }`}
        >
          All Requests ({requests.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('doctor')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
            activeTab === 'doctor'
              ? 'bg-accent text-bg shadow-sm'
              : 'text-ink-soft hover:bg-surface hover:text-ink'
          }`}
        >
          <Stethoscope className="size-3.5" />
          Doctors ({requests.filter((r) => r.role !== 'staff').length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
            activeTab === 'staff'
              ? 'bg-accent text-bg shadow-sm'
              : 'text-ink-soft hover:bg-surface hover:text-ink'
          }`}
        >
          <Building2 className="size-3.5" />
          Front Desk Staff ({requests.filter((r) => r.role === 'staff').length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="size-8 animate-spin text-accent" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface p-12 text-center">
          <UserCheck className="size-10 text-ink-faint mb-3" />
          <h3 className="font-display text-lg font-medium text-ink">No Verification Requests</h3>
          <p className="text-xs text-ink-soft mt-1">
            When doctors or front desk personnel register and submit credentials, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((req) => {
            const isDoc = req.role !== 'staff'
            return (
              <div
                key={req.id}
                className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-sm hover:border-accent/30 transition-colors"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid size-10 place-items-center rounded-full font-semibold ${
                        isDoc
                          ? 'bg-indigo-500/10 text-indigo-500'
                          : 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                      }`}
                    >
                      {req.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base font-semibold text-ink">
                          {isDoc ? `Dr. ${req.fullName}` : req.fullName}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider ${
                            isDoc
                              ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                              : 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                          }`}
                        >
                          {isDoc ? <Stethoscope className="size-3" /> : <Building2 className="size-3" />}
                          {isDoc ? 'Doctor' : 'Front Desk'}
                        </span>
                      </div>
                      <p className="text-xs text-ink-soft">{req.designation}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        req.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}
                    >
                      {req.status === 'approved' ? (
                        <>
                          <CheckCircle2 className="size-3.5" /> Approved
                        </>
                      ) : (
                        <>
                          <Clock className="size-3.5" /> Pending Review
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs text-ink-soft">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-ink-faint">
                      {isDoc ? 'Medical Reg. Number' : 'Staff Employee ID'}
                    </span>
                    <span className="font-mono text-ink text-sm">{req.idNumber}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-ink-faint">Email</span>
                    <span className="text-ink">{req.email}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-ink-faint">Submitted At</span>
                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                  {req.otp ? (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-ink-faint">Issued OTP (Valid 2 days)</span>
                      <span className="font-mono text-accent text-sm font-bold tracking-wider">{req.otp}</span>
                    </div>
                  ) : null}
                </div>

                {req.idImageUrl ? (
                  <div className="mt-2 flex flex-col gap-1.5 border-t border-line pt-3">
                    <span className="text-xs font-medium text-ink-faint flex items-center gap-1">
                      <FileText className="size-3.5" /> Uploaded ID Document / Photo:
                    </span>
                    <img
                      src={req.idImageUrl}
                      alt="ID Document"
                      className="max-h-48 rounded-xl object-contain border border-line bg-bg p-2 self-start"
                    />
                  </div>
                ) : null}

                {req.status === 'pending' ? (
                  <div className="flex items-center justify-end gap-3 border-t border-line pt-4 mt-1">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(req)}
                      disabled={actionLoading === req.id}
                      className="gap-2"
                    >
                      {actionLoading === req.id ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Approving &amp; Generating OTP...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-4" />
                          Approve {isDoc ? 'Doctor' : 'Front Desk Staff'} &amp; Generate OTP
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between border-t border-line pt-3 text-xs text-emerald-500">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-4" />
                      {isDoc ? 'Doctor' : 'Front Desk Staff'} has been approved by administrator. Access unlocked.
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
