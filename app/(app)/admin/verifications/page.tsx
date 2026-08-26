'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, CheckCircle2, FileText, Mail, UserCheck, Loader2, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getVerificationRequests, approveVerificationRequest, type DoctorVerificationRequest } from '@/lib/data/verifications'
import { sendDoctorApprovalOtpEmail } from '@/lib/email'

export default function AdminVerificationsPage() {
  const [requests, setRequests] = useState<DoctorVerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    const data = await getVerificationRequests()
    setRequests([...data])
    setLoading(false)
  }

  const handleApprove = async (req: DoctorVerificationRequest) => {
    setActionLoading(req.id)
    setNotification(null)

    try {
      const res = await approveVerificationRequest(req.id)
      if (res) {
        // Send email with OTP via Resend
        await sendDoctorApprovalOtpEmail(res.request.email, res.request.fullName, res.otp)

        setNotification(
          `Dr. ${res.request.fullName} has been approved! OTP code (${res.otp}) generated (valid 2 days) and emailed to ${res.request.email} via Resend.`,
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

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-6 text-accent" />
            <h1 className="font-display text-2xl font-semibold text-ink">Doctor Verification Management</h1>
          </div>
          <p className="text-sm text-ink-soft mt-1">
            Review submitted doctor credentials, inspect ID documents, and issue approval OTP codes.
          </p>
        </div>
        <div className="mt-2 sm:mt-0 font-mono text-xs text-ink-faint bg-surface border border-line px-3 py-1.5 rounded-lg">
          Admin: <span className="text-accent">iambotforwork72@gmail.com</span>
        </div>
      </div>

      {notification ? (
        <div className="flex items-start gap-3 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-500 border border-emerald-500/20">
          <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
          <span>{notification}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="size-8 animate-spin text-accent" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface p-12 text-center">
          <UserCheck className="size-10 text-ink-faint mb-3" />
          <h3 className="font-display text-lg font-medium text-ink">No Verification Requests</h3>
          <p className="text-xs text-ink-soft mt-1">When doctors register and upload IDs, they will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-sm hover:border-accent/30 transition-colors"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent font-semibold">
                    {req.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-ink">Dr. {req.fullName}</h3>
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
                  <span className="font-medium text-ink-faint">ID Number</span>
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
                    alt="Doctor ID"
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
                        Generating OTP & Emailing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4" />
                        Approve Doctor & Send OTP via Resend
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between border-t border-line pt-3 text-xs text-emerald-500">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4" /> Doctor has been approved. Automated approval email sent via Resend.
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
