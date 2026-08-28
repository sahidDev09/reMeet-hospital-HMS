import { Reveal } from '@/components/motion/reveal'

/**
 * The one place on this page where numbering earns its keep.
 *
 * A visit is a genuine sequence — you cannot dispense before prescribing, or
 * settle a bill before the charges exist. The order is the information, so the
 * numbers are structural here in a way they would not be on the department cards.
 */
const STEPS = [
  {
    step: '01',
    title: 'Book',
    body: 'Pick a department, a doctor, and a free slot. The slot list is what the doctor actually has open that day, not a wish.',
    surfaced: 'Appointments',
  },
  {
    step: '02',
    title: 'Check in',
    body: 'The desk marks arrival and the patient gets a queue number. The waiting room board and the doctor’s screen are the same list.',
    surfaced: 'Live queue',
  },
  {
    step: '03',
    title: 'Consult',
    body: 'The doctor opens a file that already holds the history, allergies and last prescription. Vitals go in at the top of the visit.',
    surfaced: 'Doctor portal',
  },
  {
    step: '04',
    title: 'Prescribe',
    body: 'Drugs come from the pharmacy’s own catalogue, so the dose written is a dose that exists. Prints to A5 with the registration number on it.',
    surfaced: 'Prescriptions',
  },
  {
    step: '05',
    title: 'Dispense',
    body: 'The counter scans the prescription, and selling a strip moves the stock. No parallel stock book to reconcile at closing.',
    surfaced: 'Pharmacy · POS',
  },
  {
    step: '06',
    title: 'Settle',
    body: 'Consultation, labs and medicines land on one invoice. Part payment is recorded as part payment rather than worked around.',
    surfaced: 'Billing',
  },
]

export function VisitFlow() {
  return (
    <section id="flow" className="border-y border-line bg-bg-deep/50">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <Reveal className="mb-12 flex flex-col gap-3">
          <p className="eyebrow text-accent">How a visit works</p>
          <h2 className="max-w-xl font-display text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">
            Six steps, and the file follows the patient through all of them.
          </h2>
        </Reveal>

        <Reveal stagger className="grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.step} data-reveal className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold tracking-[0.1em] text-accent">
                  {s.step}
                </span>
                <span className="h-px flex-1 bg-line" />
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-faint">
                  {s.surfaced}
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-soft">{s.body}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
