import type { Metadata } from 'next'
import { UserPlus, Users } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/app/empty-state'
import { ClearFilters, Pagination, SearchField, SelectFilter } from '@/components/app/filters'
import { PageHeader } from '@/components/app/page-header'
import { Reveal } from '@/components/motion/reveal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TBody, TD, TH, THead, TR, rowInteractive } from '@/components/ui/table'
import { listPatients } from '@/lib/data/patients'
import type { BloodGroup, Gender } from '@/lib/data/types'
import { age, date, initials, relativeDays } from '@/lib/format'

export const metadata: Metadata = { title: 'Patients' }

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; gender?: string; blood?: string; page?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page ?? 1)

  const { items, total, pageSize } = await listPatients({
    search: params.q,
    gender: params.gender as Gender | undefined,
    bloodGroup: params.blood as BloodGroup | undefined,
    page,
  })

  const filtered = Boolean(params.q || params.gender || params.blood)

  return (
    <>
      <PageHeader
        eyebrow="Records"
        title="Patients"
        description="Every record in the clinic, searchable by name, MRN or phone number."
        action={
          <Button asChild>
            <Link href="/patients/new">
              <UserPlus className="size-4" />
              Add patient
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchField placeholder="Search name, MRN or phone" className="w-full sm:w-80" />
        <SelectFilter
          param="gender"
          label="Gender"
          allLabel="Any gender"
          options={[
            { value: 'female', label: 'Female' },
            { value: 'male', label: 'Male' },
            { value: 'other', label: 'Other' },
          ]}
        />
        <SelectFilter
          param="blood"
          label="Blood group"
          allLabel="Any blood group"
          options={BLOOD_GROUPS.map((b) => ({ value: b, label: b }))}
        />
        <ClearFilters params={['q', 'gender', 'blood']} />
      </div>

      <Reveal>
        <Card>
          <CardContent className="px-0 pb-2">
            {items.length === 0 ? (
              <EmptyState
                className="mx-5 mb-4 border-0 py-12"
                icon={Users}
                title={filtered ? 'No patients match those filters' : 'No patients yet'}
                description={
                  filtered
                    ? 'Try a phone number, or clear the filters to see the full list.'
                    : 'Add the first one to start a record.'
                }
                action={
                  filtered ? null : (
                    <Button asChild size="sm">
                      <Link href="/patients/new">Add patient</Link>
                    </Button>
                  )
                }
              />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Patient</TH>
                    <TH>MRN</TH>
                    <TH>Age</TH>
                    <TH>Blood</TH>
                    <TH>Phone</TH>
                    <TH>Flags</TH>
                    <TH>Last visit</TH>
                  </TR>
                </THead>
                <TBody>
                  {items.map((p) => (
                    <TR key={p.id} className={rowInteractive}>
                      <TD>
                        <Link href={`/patients/${p.id}`} className="flex items-center gap-2.5">
                          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft font-display text-[0.6875rem] font-semibold text-accent">
                            {initials(p.name)}
                          </span>
                          <span>
                            <span className="block font-medium text-ink">{p.name}</span>
                            <span className="block text-xs capitalize text-ink-faint">
                              {p.gender} · {p.address.split(',')[0]}
                            </span>
                          </span>
                        </Link>
                      </TD>
                      <TD className="font-mono text-xs text-ink-soft">{p.mrn}</TD>
                      <TD className="font-mono text-xs text-ink-soft">{age(p.dob)}</TD>
                      <TD>
                        <span className="font-mono text-xs font-medium text-ink">
                          {p.bloodGroup}
                        </span>
                      </TD>
                      <TD className="font-mono text-xs text-ink-soft">{p.phone}</TD>
                      <TD>
                        <span className="flex flex-wrap gap-1">
                          {p.allergies.length > 0 ? (
                            <Badge tone="crit">
                              {p.allergies.length === 1
                                ? p.allergies[0]
                                : `${p.allergies.length} allergies`}
                            </Badge>
                          ) : null}
                          {p.conditions.length > 0 ? (
                            <Badge tone="warn">
                              {p.conditions.length === 1
                                ? p.conditions[0]
                                : `${p.conditions.length} conditions`}
                            </Badge>
                          ) : null}
                          {p.allergies.length === 0 && p.conditions.length === 0 ? (
                            <span className="text-xs text-ink-faint">—</span>
                          ) : null}
                        </span>
                      </TD>
                      <TD className="text-xs text-ink-soft">
                        {p.lastVisitAt ? (
                          <>
                            {relativeDays(p.lastVisitAt)}
                            <span className="block font-mono text-[0.6875rem] text-ink-faint">
                              {date(p.lastVisitAt)}
                            </span>
                          </>
                        ) : (
                          <span className="text-ink-faint">Never seen</span>
                        )}
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
