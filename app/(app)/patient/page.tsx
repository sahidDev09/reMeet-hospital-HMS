'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, FileText, Plus, Clock, Lock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { patients, appointments as fixtureAppointments, prescriptions as fixturePrescriptions, doctors as fixtureDoctors } from '@/lib/data/fixtures'
import type { Prescription } from '@/lib/data/types'

export default function PatientPortalPage() {
  const patient = patients[0] // Demo patient: Sarah Jenkins
  const appointments = fixtureAppointments.filter((a) => a.patientId === patient.id)
  const prescriptions = fixturePrescriptions.filter((p) => p.patientId === patient.id)

  const [activeTab, setActiveTab] = useState<'appointments' | 'prescriptions' | 'book'>('appointments')
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)

  // Booking state
  const [selectedDoctor, setSelectedDoctor] = useState(fixtureDoctors[0].id)
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0])
  const [bookingReason, setBookingReason] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(false)

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault()
    setBookingSuccess(true)
    setTimeout(() => {
      setBookingSuccess(false)
      setActiveTab('appointments')
    }, 2000)
  }

  return (
    <div className="flex flex-col gap-6 p-5 sm:p-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent font-display text-xl font-bold">
            {patient.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-semibold text-ink">{patient.name}</h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-accent-soft text-accent font-medium">
                MRN: {patient.mrn}
              </span>
            </div>
            <p className="text-xs text-ink-soft mt-0.5">
              Blood Group: <strong className="text-ink">{patient.bloodGroup}</strong> · Phone: <strong className="text-ink">{patient.phone}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setActiveTab('book')}
            className="gap-2"
          >
            <Plus className="size-4" /> Book Appointment
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/">Landing Page</Link>
          </Button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
            activeTab === 'appointments'
              ? 'bg-accent text-bg shadow-md'
              : 'text-ink-soft hover:bg-accent-soft/50 hover:text-ink'
          }`}
        >
          <Calendar className="size-4" /> Appointments ({appointments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('prescriptions')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
            activeTab === 'prescriptions'
              ? 'bg-accent text-bg shadow-md'
              : 'text-ink-soft hover:bg-accent-soft/50 hover:text-ink'
          }`}
        >
          <FileText className="size-4" /> Prescriptions ({prescriptions.length})
          <span className="ml-1 inline-flex items-center gap-0.5 text-[0.625rem] uppercase tracking-wider bg-surface/20 px-1.5 py-0.5 rounded font-mono">
            <Lock className="size-2.5" /> Read-Only
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('book')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
            activeTab === 'book'
              ? 'bg-accent text-bg shadow-md'
              : 'text-ink-soft hover:bg-accent-soft/50 hover:text-ink'
          }`}
        >
          <Plus className="size-4" /> Book New Visit
        </button>
      </div>

      {/* Tab 1: Appointments List */}
      {activeTab === 'appointments' ? (
        <div className="flex flex-col gap-4">
          <h3 className="font-display text-lg font-semibold text-ink">My Appointments History</h3>
          <div className="grid gap-3">
            {appointments.map((apt) => {
              const doc = fixtureDoctors.find((d) => d.id === apt.doctorId)
              return (
                <div
                  key={apt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                      <Calendar className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-display text-sm font-semibold text-ink">
                        Consultation with Dr. {doc?.name || 'Doctor'}
                      </h4>
                      <p className="text-xs text-ink-soft">
                        {doc?.specialty} · Room {doc?.roomNo}
                      </p>
                      <p className="text-xs text-ink-faint mt-0.5">Reason: {apt.reason}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-line">
                    <div className="text-left sm:text-right">
                      <p className="font-mono text-xs font-medium text-ink">
                        {new Date(apt.start).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="font-mono text-[0.6875rem] text-ink-faint">
                        {new Date(apt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-500 border border-emerald-500/20">
                      {apt.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* Tab 2: Prescriptions (Read-Only) */}
      {activeTab === 'prescriptions' ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-ink">My Prescriptions</h3>
            <span className="flex items-center gap-1.5 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full font-medium">
              <Lock className="size-3" /> Prescriptions are read-only and cannot be modified by patients
            </span>
          </div>

          <div className="grid gap-3">
            {prescriptions.map((rx) => {
              const doc = fixtureDoctors.find((d) => d.id === rx.doctorId)
              return (
                <div
                  key={rx.id}
                  className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 shadow-sm hover:border-accent/40 transition-colors"
                >
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-accent">{rx.code}</span>
                        <span className="text-xs text-ink-soft">· Issued: {new Date(rx.issuedAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-display text-sm font-semibold text-ink mt-0.5">
                        Prescribed by Dr. {doc?.name} ({doc?.regNo})
                      </h4>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedPrescription(selectedPrescription?.id === rx.id ? null : rx)}
                    >
                      {selectedPrescription?.id === rx.id ? 'Hide Details' : 'View Full Details'}
                    </Button>
                  </div>

                  <div className="text-xs text-ink-soft">
                    <p><strong>Diagnosis:</strong> {rx.diagnosis}</p>
                    <p className="mt-1"><strong>Chief Complaints:</strong> {rx.complaints}</p>
                  </div>

                  {/* Medicines list */}
                  <div className="flex flex-col gap-2 rounded-lg bg-bg p-3 border border-line mt-1">
                    <span className="text-[0.6875rem] font-mono uppercase tracking-wider text-ink-faint">
                      Prescribed Medicines ({rx.items.length})
                    </span>
                    {rx.items.map((item, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs border-b border-line/50 pb-1.5 last:border-0 last:pb-0">
                        <div>
                          <span className="font-medium text-ink">{item.name}</span>
                          <span className="ml-2 font-mono text-[0.6875rem] text-ink-faint">{item.strength}</span>
                        </div>
                        <span className="font-mono text-accent">
                          {item.dosage.morning}-{item.dosage.noon}-{item.dosage.night} ({item.durationDays} days)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* Tab 3: Book Appointment */}
      {activeTab === 'book' ? (
        <div className="mx-auto w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-xl flex flex-col gap-5">
          <div className="flex flex-col gap-1 text-center">
            <h3 className="font-display text-xl font-semibold text-ink">Book Doctor Appointment</h3>
            <p className="text-xs text-ink-soft">Select your preferred specialist and appointment date.</p>
          </div>

          {bookingSuccess ? (
            <div className="flex flex-col items-center gap-3 p-6 text-center bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <CheckCircle2 className="size-10 text-emerald-500" />
              <h4 className="font-display text-lg font-semibold text-ink">Appointment Requested!</h4>
              <p className="text-xs text-ink-soft">
                Your appointment request has been scheduled. Front desk will confirm your queue position upon check-in.
              </p>
            </div>
          ) : (
            <form onSubmit={handleBook} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-ink">Select Doctor</label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="h-10 rounded-lg border border-line bg-bg px-3 text-sm text-ink outline-none focus:border-accent"
                >
                  {fixtureDoctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.name} — {doc.specialty} (${doc.consultationFee})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-ink">Preferred Date</label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="h-10 rounded-lg border border-line bg-bg px-3 text-sm text-ink outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-ink">Reason for Visit</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Regular health checkup or specific symptoms"
                  value={bookingReason}
                  onChange={(e) => setBookingReason(e.target.value)}
                  className="rounded-lg border border-line bg-bg p-3 text-sm text-ink outline-none focus:border-accent"
                />
              </div>

              <Button type="submit" size="lg" className="w-full gap-2 mt-2">
                <Calendar className="size-4" /> Confirm Booking
              </Button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  )
}
