'use client'

import { useTransition } from 'react'
import { Check, FilePlus2, LogIn, Play, UserX, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { setStatusAction } from '@/app/actions/appointments'
import { Button } from '@/components/ui/button'
import type { AppointmentStatus } from '@/lib/data/types'

type Context = 'desk' | 'chamber'

/**
 * The buttons that move a visit forward.
 *
 * What you can do to an appointment depends on where you're standing. The desk
 * checks people in and marks no-shows; the doctor starts and finishes consults.
 * Showing both sets everywhere would mean a doctor can accidentally cancel a
 * visit from the chamber, so the context decides.
 *
 * Only the next legal step is offered. There is no dropdown of all six statuses,
 * because "in consult" straight from "cancelled" isn't a thing that happens.
 */
export function AppointmentActions({
  id,
  status,
  patientId,
  context = 'desk',
}: {
  id: string
  status: AppointmentStatus
  patientId: string
  context?: Context
}) {
  const [pending, start] = useTransition()

  function move(next: AppointmentStatus, message: string) {
    start(async () => {
      const result = await setStatusAction(id, next)
      if (!result.ok) {
        toast.error(result.error ?? 'That did not go through.')
        return
      }
      toast.success(
        next === 'checked-in' && result.queueNo
          ? `${message} Queue number ${String(result.queueNo).padStart(2, '0')}.`
          : message,
      )
    })
  }

  if (status === 'completed') {
    return (
      <Button asChild variant="ghost" size="sm">
        <Link href={`/prescriptions/new?patientId=${patientId}`}>
          <FilePlus2 />
          Prescribe
        </Link>
      </Button>
    )
  }

  if (status === 'cancelled' || status === 'no-show') {
    return <span className="text-xs text-ink-faint">Closed</span>
  }

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {status === 'scheduled' && context === 'desk' ? (
        <>
          <Button size="sm" disabled={pending} onClick={() => move('checked-in', 'Checked in.')}>
            <LogIn />
            Check in
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => move('cancelled', 'Appointment cancelled.')}
          >
            <X />
            Cancel
          </Button>
        </>
      ) : null}

      {status === 'scheduled' && context === 'chamber' ? (
        <span className="text-xs text-ink-faint">Waiting on the desk</span>
      ) : null}

      {status === 'checked-in' ? (
        <>
          <Button
            size="sm"
            disabled={pending}
            onClick={() => move('in-consult', 'Consultation started.')}
          >
            <Play />
            Start consult
          </Button>
          {context === 'desk' ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => move('no-show', 'Marked as no show.')}
            >
              <UserX />
              No show
            </Button>
          ) : null}
        </>
      ) : null}

      {status === 'in-consult' ? (
        <>
          <Button
            size="sm"
            disabled={pending}
            onClick={() => move('completed', 'Visit completed.')}
          >
            <Check />
            Complete
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/prescriptions/new?patientId=${patientId}&appointmentId=${id}`}>
              <FilePlus2 />
              Prescribe
            </Link>
          </Button>
        </>
      ) : null}
    </span>
  )
}
