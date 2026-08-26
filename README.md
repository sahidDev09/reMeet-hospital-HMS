# reMeet Hospital — HMS frontend

The complete front end for the reMeet Hospital management system: public site, Clerk
authentication, and nine internal modules — dashboard, patients, doctors, doctor
portal, appointments, prescriptions, pharmacy, POS and billing, analytics.

There is no backend. Every screen reads through a typed data-access layer in
`lib/data/`, so wiring a real API means replacing function bodies, not components.

## Running it

```bash
npm install
```

```bash
npm run dev
```

`.env.local` already holds the Clerk development keys. It is gitignored and must
stay that way.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |

## Stack, and where it departs from the original spec

| Spec said | Built with | Why |
| --- | --- | --- |
| Next.js 14 | Next.js 16.2.12, React 19.2 | `@clerk/nextjs@7` peer-requires `next ≥ 15.2.8`. Next 14 cannot run current Clerk. |
| jsPDF / React-PDF | Native print CSS | Vector text, selectable, correct A5 sizing, no dependencies. Add server-side PDF bytes later if the backend needs them. |
| Express backend | Server Actions + `lib/data` | One deployable now; the backend slots in behind the same function signatures. |

Two Next 16 notes worth knowing before editing: middleware is `proxy.ts`, not
`middleware.ts`, and `params` / `searchParams` are Promises that must be awaited.

## The data layer swap

Every function in `lib/data/*.ts` is `async`, takes and returns plain serializable
objects, and has the shape a REST call would:

```ts
export async function listPatients(q?: PatientQuery): Promise<Paginated<Patient>>
export async function getPatient(id: string): Promise<Patient | null>
export async function createPatient(input: PatientInput): Promise<Patient>
```

To connect a real API, replace the body — the `await delay(...)` and the fixture
filtering — with a `fetch`. Do it one module at a time; nothing else has to change.

| Module | Owns |
| --- | --- |
| `patients.ts` | Records, search, registration |
| `doctors.ts` | Roster, availability, per-doctor rollups |
| `appointments.ts` | Calendar, slots, live queue, status moves |
| `prescriptions.ts` | Issued prescriptions and their items |
| `pharmacy.ts` | Inventory, expiry alerts, POS sales |
| `billing.ts` | Invoices, payments, ledger summaries |
| `analytics.ts` | Every figure and series on the analytics page |
| `types.ts` | The domain contract — read this first |
| `fixtures.ts` | Seed data, deterministic from fixed RNG seeds |

Two things to keep when the backend arrives:

- **Server actions re-decide anything the client could lie about.** `app/actions/pharmacy.ts`
  re-reads each medicine's own price and stock rather than trusting the cart;
  `app/actions/billing.ts` re-derives the outstanding balance before taking a
  payment. Keep that pattern — move the checks to the API, don't drop them.
- **Mock mutations are not persistent.** `lib/data/store.ts` holds fixtures in
  module memory, so a new patient survives navigation but not a server restart.
  That's by design, not a bug to fix in the mock.

## Roles

Real path: Clerk `publicMetadata.role`, surfaced as a session claim. It needs one
Dashboard setting — **Sessions → Customize session token** — set to:

```json
{ "metadata": "{{user.public_metadata}}" }
```

Then give each test user `{ "role": "admin" | "doctor" | "staff" }` in public
metadata. `types/globals.d.ts` already declares the claim shape.

Until that's configured, `getRole()` falls back to a `remeet_role` cookie set by
the Role Switcher in the topbar, which is gated to `NODE_ENV !== 'production'`.
The session claim always wins over the cookie.

**The switcher is a review affordance, not access control.** `requireRole()` keeps
the wrong role out of a route, but with no backend there is nothing behind the
route to enforce anything. Real authorization belongs on the server that owns the
data. Before production: remove `components/app/role-switcher.tsx` and the
`remeet_role` branch in `lib/auth/roles.ts`.

## Before production

- **Rotate the Clerk keys.** The secret key in `.env.local` was shared in chat
  during development and must be treated as compromised.
- Remove the dev Role Switcher and its cookie fallback (above).
- Point `lib/data` at the real API and re-implement the server-side checks there.
- Change currency in one place if needed: `CURRENCY` in `lib/format.ts`.

## Design system

Direction: soft glass over a lavender field, electric blue held back for actions
and data. All tokens are in `app/globals.css` under `@theme inline` — Tailwind 4 is
CSS-first, so there is no `tailwind.config.js`.

- **Colour.** `--bg` `#EEF0FA`, frosted `--surface`, ink `#10131C`, accent `#2563EB`
  (`#4F82FF` in dark). The three `--vital-*` colours are functional, not
  decorative: they encode in-stock / expiring / expired and paid / partial /
  overdue, and nothing else may use them.
- **Type.** Instrument Sans for display, Inter for body, IBM Plex Mono for data.
  The mono face is a safety property, not a style: unambiguous `0/O` and `1/l/I`
  when a screen reads `500mg` or a dosage of `1-0-1`. Families are named through
  CSS variables rather than `next/font` so the app builds with no network.
- **The pulse line.** One motif doing five jobs: the hero ECG trace, section
  dividers, stat-card sparklines drawn from real 7-day data, pending indicators,
  and the rule under the wordmark on printed sheets.
- **Charts** draw only from `--chart-1..5` via `lib/charts.ts`, read as CSS
  variables so a theme switch needs no re-render.

Quality floor, applied throughout: responsive to mobile, visible focus ring on
everything focusable, `prefers-reduced-motion` respected at both the CSS and GSAP
layers, semantic tables for tabular data, labelled form controls.

## Printing

Prescriptions and invoices print as A5 documents, not screenshots. `PrintSheet`
marks the document `data-print="sheet"`; app chrome carries `data-print="hide"`;
blocks that must not split across pages carry `data-print="keep"`. Rules live at
the bottom of `app/globals.css`.
