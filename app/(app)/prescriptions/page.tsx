import type { Metadata } from 'next'
import { FilePlus2, FileText } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/app/empty-state'
import { ClearFilters, Pagination, SearchField } from '@/components/app/filters'
import { PageHeader } from '@/components/app/page-header'
import { Reveal } from '@/components/motion/reveal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TBody, TD, TH, THead, TR, rowInteractive } from '@/components/ui/table'
import { getDoctor } from '@/lib/data/doctors'
import { listPrescriptions } from '@/lib/data/prescriptions'
import { date, dosage, relativeDays } from '@/lib/format'

export const metadata: Metadata = { title: 'Prescriptions' }

/**
 * Every prescription written, newest first.
 *
 * The medicines are listed in the row itself rather than hidden behind the code.
 * Someone auditing a week of prescriptions is looking for what was given, and
 * making them open thirty pages to find out would be the wrong trade.
 */
export default async function PrescriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; doctorId?: string; patientId?: string; page?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page ?? 1)

  const [{ items, total, pageSize }, doctor] = await Promise.all([
    listPrescriptions({
      search: params.q,
      doctorId: params.doctorId,
      patientId: params.patientId,
      page,
    }),
    params.doctorId ? getDoctor(params.doctorId) : Promise.resolve(null),
  ])

  const filtered = Boolean(params.q || params.doctorId || params.patientId)

  return (
    <>
      <PageHeader
        eyebrow="Care"
        title="Prescriptions"
        description={
          doctor
            ? `Written by ${doctor.name}.`
            : 'Searchable by code, patient, MRN or diagnosis.'
        }
        action={
          <Button asChild>
            <Link href="/prescriptions/new">
              <FilePlus2 className="size-4" />
              Write prescription
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchField placeholder="Search code, patient or diagnosis" className="w-full sm:w-80" />
        <ClearFilters params={['q', 'doctorId', 'patientId']} />
      </div>

      <Reveal>
        <Card>
          <CardContent className="px-0 pb-2">
            {items.length === 0 ? (
              <EmptyState
                className="mx-5 mb-4 border-0 py-12"
                icon={FileText}
                title={filtered ? 'Nothing matches' : 'No prescriptions yet'}
                description={
                  filtered
                    ? 'Try a prescription code, or clear the filters.'
                    : 'Finish a consultation and it will appear here.'
                }
                action={
                  filtered ? null : (
                    <Button asChild size="sm">
                      <Link href="/prescriptions/new">Write one</Link>
                    </Button>
                  )
                }
              />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Code</TH>
                    <TH>Patient</TH>
                    <TH>Diagnosis</TH>
                    <TH>Medicines</TH>
                    <TH>Doctor</TH>
                    <TH>Issued</TH>
                  </TR>
                </THead>
                <TBody>
                  {items.map((rx) => (
                    <TR key={rx.id} className={rowInteractive}>
                      <TD>
                        <Link
                          href={`/prescriptions/${rx.id}`}
                          className="font-mono text-xs font-medium text-ink hover:text-accent"
                        >
                          {rx.code}
                        </Link>
                      </TD>
                      <TD>
                        <span className="block font-medium text-ink">{rx.patient.name}</span>
                        <span className="block font-mono text-[0.6875rem] text-ink-faint">
                          {rx.patient.mrn}
                        </span>
                      </TD>
                      <TD className="text-ink-soft">
                        {rx.diagnosis}
                        {rx.followUpAt ? (
                          <span className="mt-0.5 block text-[0.6875rem] text-ink-faint">
                            Follow-up {relativeDays(rx.followUpAt)}
                          </span>
                        ) : null}
                      </TD>
                      <TD>
                        <span className="flex flex-col gap-0.5">
                          {rx.items.slice(0, 2).map((item, i) => (
                            <span key={i} className="text-xs text-ink-soft">
                              {item.name}{' '}
                              <span className="font-mono text-accent">{dosage(item.dosage)}</span>
                            </span>
                          ))}
                          {rx.items.length > 2 ? (
                            <Badge tone="neutral">+{rx.items.length - 2} more</Badge>
                          ) : null}
                        </span>
                      </TD>
                      <TD className="text-ink-soft">{rx.doctor.name}</TD>
                      <TD className="whitespace-nowrap font-mono text-xs text-ink-soft">
                        {date(rx.issuedAt)}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Reveal>

      <Pagination page={page} pageSize={pageSize} total={total} className="mt-4" />
    </>
  )
}
