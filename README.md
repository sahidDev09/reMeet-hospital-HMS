# reMeet Hospital — HMS Frontend

The complete front end for the reMeet Hospital management system: public site, Next.js OAuth & Native authentication, and internal clinical modules — dashboard, patients, doctors, doctor portal, appointments, prescriptions, pharmacy, POS and billing, analytics.

Every screen reads through a typed data-access layer in `lib/data/`, so wiring a real backend API means replacing function bodies, not components.

## Running it

```bash
npm install
```

```bash
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |

## Authentication & OAuth

reMeet uses a self-contained Next.js OAuth & Authentication architecture (`lib/auth/`):

- **OAuth Providers**: Google OAuth and GitHub OAuth. In development or demo mode, 1-click instant login is enabled without requiring external OAuth credentials.
- **Demo Quick Access**: Pre-configured instant sign-in buttons for all 4 roles (`Administrator`, `Doctor`, `Front Desk`, `Patient`).
- **Session Layer**: Server-side session resolution via HTTP-only secure session cookies (`SESSION_COOKIE`), client-side `useAuth()` hook and `<AuthProvider>`.
- **Role-based Access Control**: Server-side `getRole()`, `requireRole()`, and `homeFor()` helpers with smooth transition between Doctor Portal (`/portal`) and Hospital Dashboard (`/dashboard`).

## Roles & Accounts

| Role | Default Email | Portal Access |
| --- | --- | --- |
| **Administrator** | `iambotforwork72@gmail.com` | Full Administrative & System Dashboard (`/dashboard`) |
| **Doctor** | `dr.eleanor@remeet.health` | Doctor Clinical Portal & Consultations (`/portal`) |
| **Front Desk** | `staff@remeet.health` | Reception, Appointments & Billing (`/dashboard`) |
| **Patient** | `patient@remeet.health` | Booking & Prescriptions (`/patient`) |

## Verification & 2FA

- **Doctor Verification**: Doctors register with official ID credentials which notifies the administrator via Resend email. Approval unlocks an OTP code.
- **Admin 2FA**: Administrator login includes Two-Factor Authentication with OTP delivery via Resend.

## Design System

Soft glass over a lavender field, electric blue held back for actions and data. All tokens are in `app/globals.css` under `@theme inline` with Tailwind CSS v4.
