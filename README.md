# OTR-India (Prototype)

An independent Smart India Hackathon prototype demonstrating **One-Time
Registration (OTR)** — a concept where a citizen maintains a reusable
profile, education, credential, and document metadata record, and
explicitly consents to sharing relevant information with different
government application portals.

> **This is a prototype/demo only.** It is not a production government
> system, and it does not integrate with real Aadhaar, DigiLocker,
> biometric, or any actual government API. All data used is
> synthetic/demo data. This project is independent and does not
> reference or depend on any other OTR-India repository.

## Milestone Tracker

| Milestone | Description                                                   | Status |
| --------- | -------------------------------------------------------------- | :----: |
| M1        | Project foundation (frontend/backend/DB wiring, health check)  |   ✅   |
| M2        | Authentication + OTR identity + profile                        |   ✅   |
| M3        | Education + credentials + document metadata + verification status |  ✅   |
| M4        | Consent + interoperability + two mock government portals + applications | ✅ |
| M5.1      | Dashboard UI                                                    |   ✅   |
| M5.2      | Consent & Access History                                        |   ✅   |
| M5.3      | Demo UX polish (shared nav, shared styles, terminology)          |   ✅   |
| M5.4      | Final E2E verification + architecture freeze                    |   ✅   |

**The codebase is frozen as of M5.4.** All planned milestones for this
prototype are complete. No new features, schema changes, or
dependencies were introduced in M5.4 — it is verification and
documentation only.

## Architecture

- **Frontend:** React + TypeScript + Vite (`frontend/`)
- **Backend:** Node.js + Express + TypeScript (`backend/`)
- **Database:** SQLite, accessed via Drizzle ORM (`database/`, wired up
  from `backend/src/db/`)
- **API style:** REST, backend routes namespaced under `/api`

The frontend and backend are separate npm projects with independent
`package.json` files. The frontend calls the backend over HTTP using a
base URL from an environment variable — there is no shared build step
or monorepo tooling.

```
OTR-India-Aadi/
├── frontend/     React + TS + Vite app
├── backend/      Express + TS API server
├── database/     SQLite file + Drizzle migrations
├── docs/         Design/architecture notes
└── README.md
```

### Schema freeze confirmation (M5.4)

The Drizzle schema (`backend/src/db/schema.ts`) is locked. As of this
milestone:

- **9 application tables** are defined: `users`, `profiles`,
  `education`, `credentials`, `documents`, `portals`,
  `portal_field_mappings`, `consents`, `applications`.
- **3 migrations** exist under `database/migrations/`
  (`0000_ancient_lockjaw.sql`, `0001_black_otto_octavius.sql`,
  `0002_zippy_hercules.sql`), all applied and verified against a fresh
  database.
- Running `npx drizzle-kit generate` against the current schema
  produces **"No schema changes, nothing to migrate"** — confirming
  there is no drift between the schema code and the committed
  migrations, and nothing pending.
- `npm run db:migrate` was re-run against a brand-new SQLite file and
  confirmed to create all 9 tables cleanly with no errors.

No schema changes were made in M5.4. This section only documents the
verification that was performed.

## Prerequisites

- Node.js 18+ and npm

## Quick Start — Foolproof Commands for the SIH Presentation

Run these in **two separate terminals**, in order. These are the exact
commands to use right before a live demo.

**Terminal 1 — Backend**

```bash
cd backend
cp .env.example .env      # only needed the very first time
npm install
npm run db:migrate        # safe to re-run; no-ops if already migrated
npm run dev
```

Wait for:
```
[otr-india-backend] listening on http://localhost:4000
```

Sanity check in a browser or with curl:
```bash
curl http://localhost:4000/api/health
```
Expected: `{"status":"ok","service":"otr-india-backend","db":"connected",...}`

**Terminal 2 — Frontend**

```bash
cd frontend
cp .env.example .env      # only needed the very first time
npm install
npm run dev
```

Wait for the local URL (typically **http://localhost:5173**) and open
it in a browser.

**Before presenting:** if you want a guaranteed-clean database for the
demo (no leftover test users/applications from development), stop the
backend and run:

```bash
cd backend
rm -f ../database/otr.db ../database/otr.db-journal ../database/otr.db-wal ../database/otr.db-shm
npm run db:migrate
npm run dev
```

This recreates an empty database with the two mock portals seeded
automatically (Scholarship Application Portal, Employment Application
Portal) and no user data.

### Backend scripts

| Script                 | Purpose                                          |
| ----------------------- | ------------------------------------------------- |
| `npm run dev`           | Start the API server in watch mode                |
| `npm run build`         | Compile TypeScript to `dist/`                     |
| `npm start`             | Run the compiled server (`dist/index.js`)         |
| `npm run db:generate`   | Generate Drizzle migration files from the schema  |
| `npm run db:migrate`    | Apply migrations to the SQLite database           |
| `npm run db:seed`       | Manually (re-)seed the two mock portals if needed |

### Frontend scripts

| Script            | Purpose                              |
| ------------------ | ------------------------------------- |
| `npm run dev`       | Start the Vite dev server            |
| `npm run build`     | Type-check and build for production  |
| `npm run preview`   | Preview the production build locally |

## Environment Variables

**`backend/.env`** (see `backend/.env.example`)

```
PORT=4000
DATABASE_URL=../database/otr.db
FRONTEND_ORIGIN=http://localhost:5173
JWT_SECRET=otr-india-demo-secret-change-me
JWT_EXPIRES_IN=7d
```

`JWT_SECRET` is required — the server will refuse to start without it.
The value shipped in `.env.example` is a demo placeholder only; never
expose real secrets or `.env` files in a public repository or UI.

**`frontend/.env`** (see `frontend/.env.example`)

```
VITE_API_BASE_URL=http://localhost:4000
```

## Manual End-to-End (E2E) Testing Script

Run this before any demo or presentation to confirm the full flow
works. Takes about 3–5 minutes. Requires both servers running (see
Quick Start above) and a fresh or known database state.

1. **Register a new citizen**
   - Open the frontend, go to **Register**.
   - Fill in email, password (8+ characters), full name, date of
     birth, and a 10-digit mobile number. Submit.
   - ✅ Expect: automatic login and redirect to the **Dashboard**,
     showing a freshly generated **OTR ID** (format `OTR-XXXXXXXX`).

2. **Populate reusable OTR data**
   - Go to **Profile**. Click **Edit Profile** and add an **Address**.
     Save.
   - Scroll to **Education** → **Add Education**. Fill in institution,
     degree/qualification, field of study, start year. Save.
   - Scroll to **Documents** → **Add Document**. Fill in document type
     and name (e.g. "Marksheet"). Save.
   - ✅ Expect: all three sections show the new records immediately
     without a page reload; the Documents record shows status
     `USER_PROVIDED`.

3. **Check the Dashboard reflects the new data**
   - Go to **Dashboard**.
   - ✅ Expect: **Profile Completion** shows 100% (or increased from
     before); the **Reusable OTR Data** summary cards show updated
     counts for Education and Documents; the OTR identity card still
     shows the same OTR ID from step 1.

4. **Grant consent at a mock government portal**
   - Go to **Government Services**.
   - Select **Scholarship Application Portal**.
   - ✅ Expect: a consent screen listing the reusable data categories
     that will be shared (Basic Profile, Contact Information, Address,
     Education Records, Selected Credentials).
   - Click **I Consent & Continue**.
   - ✅ Expect: a review screen split into **Reusable OTR Data**
     (prefilled, using this portal's own field names) and
     **Application-Specific Data** (empty fields to fill in).
   - Fill in the application-specific fields (e.g. Scholarship Type,
     Annual Income, Preferred Institution) and click **Submit
     Application**.
   - ✅ Expect: a success screen showing a generated application
     number in the format `APP-SCH-XXXXXXXX`.

5. **Review the Dashboard again**
   - Go to **Dashboard**.
   - ✅ Expect: the **Applications** section now shows 1 total, 1
     submitted, with the new application listed (portal name,
     application number, status `SUBMITTED`).

6. **Review and revoke consent**
   - Go to **Consent History**.
   - ✅ Expect: the Scholarship Application Portal consent appears
     under **Active Consent**, showing a granted timestamp and the
     data categories covered.
   - Click **Revoke Consent** on that entry.
   - ✅ Expect: it immediately moves to the **Revoked / Historical**
     section with a revoked timestamp; **Active Consent** is now empty
     (unless other consents exist).

7. **Confirm revocation requires a fresh explicit consent**
   - Still on **Government Services**, select **Scholarship Application
     Portal** again.
   - ✅ Expect: you are shown the consent screen again — selecting a
     portal always starts a fresh consent step, so revocation cannot
     be silently bypassed; reusing the portal always requires clicking
     **I Consent & Continue** again, which grants a brand-new consent.
   - *(Optional, for a technical audience.)* The backend itself
     enforces this at the API level: `POST /api/applications/preview`
     returns `403` for a portal whose only consent record has
     `status: "REVOKED"`, and only succeeds again after a new
     `POST /api/consents` grant. You can verify this directly with
     `curl` against `http://localhost:4000/api/consents` and
     `/api/applications/preview` using the JWT from your browser's
     `localStorage` if you want to demonstrate it without the UI.

8. **Confirm the previously submitted application persists**
   - Go to **My Applications**.
   - ✅ Expect: the Scholarship application from step 4 is still
     listed with its full application number and status, unaffected
     by the consent revocation in step 6.

If every ✅ above holds, the full OTR-India flow — registration,
reusable data entry, consent, portal-specific data mapping,
application submission, dashboard visibility, and consent revocation —
is confirmed working end-to-end.

## Milestone Details

**Milestone 1 (Project Foundation):** frontend/backend/database wiring
and a health-check endpoint.

**Milestone 2 (Registration, Login, OTR Profile):**

- User registration with email + password (bcrypt-hashed, never stored
  or returned in plaintext)
- Login returning a prototype JWT session token
- OTR ID generation — an 8-character random demo identifier
  (`OTR-XXXXXXXX`) generated from cryptographically random data only,
  **not** derived from email, phone, date of birth, or any government
  identifier
- A basic citizen profile (full name, date of birth, mobile number,
  address) linked 1:1 to a user
- Authenticated `GET /api/profile` and `PATCH /api/profile`
- Register / Login / Profile screens, with logout and route protection

**Milestone 3 (Reusable Education, Credentials, Document Metadata):**

- Reusable `education`, `credentials`, and `documents` records tied to
  a user (not to any government application, portal, or consent flow)
- Full CRUD via `/api/education`, `/api/credentials`, `/api/documents`
  (all authenticated, all scoped to the requesting user only)
- A shared prototype "verification lifecycle" status (`USER_PROVIDED`,
  `PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`, `EXPIRED`, `REVOKED`)
  used across all three record types — a demo concept only, **not**
  real government or issuer verification
- Documents are **metadata/reference only** — no real file upload or
  storage exists anywhere in this codebase

**Milestone 4 (Consent + Interoperability + Mock Portals + Applications):**
the core SIH demonstration.

- Two fictional mock government portals, seeded automatically on
  server startup: **Scholarship Application Portal** and **Employment
  Application Portal**
- A data-driven `portal_field_mappings` table: the same canonical OTR
  fields (`fullName`, `dateOfBirth`, `mobileNumber`, `email`,
  `address`, `educationRecords`, `credentials`) are mapped to
  intentionally different field names per portal (e.g. `applicantName`
  vs `candidateName`, `dob` vs `birthDate`) — no per-portal branching
  logic in the route handlers
- Explicit consent: a user must grant consent for a specific portal
  before their OTR data can be previewed or used in an application;
  revoking consent immediately blocks further previews/submissions for
  that portal
- `POST /api/applications/preview` — maps reusable OTR data into a
  portal's field names **without** creating an application
- `POST /api/applications` — submits an application (portal-mapped
  fields + application-specific fields together), generates a demo
  application number (`APP-SCH-XXXXXXXX` / `APP-EMP-XXXXXXXX`) from
  cryptographically random data only
- Frontend "Government Services" flow: select a portal → consent
  screen → prefilled review (clearly separated from application-specific
  fields) → submit → application number confirmation
- "My Applications" page listing the user's own submitted applications

Application-specific fields (e.g. `scholarshipType`, `jobRole`) are
never written back into the reusable OTR profile/education/credentials
tables — they exist only inside a specific application's stored data.

**Milestone 5, Part 1 (Dashboard UI):** an authenticated `/dashboard`
page that becomes the landing page after login/registration:

- OTR identity card, profile completion percentage/progress bar,
  reusable data summary, applications summary, and quick actions
- Clear separation between Reusable OTR Data and Application-Specific
  Data throughout

**Milestone 5, Part 2 (Consent & Access History):** an authenticated
`/consents` page built entirely on the existing M4 consent API:

- Every portal the user has granted consent to, split into **Active
  Consent** and **Revoked / Historical** sections
- Portal name, portal code, status, granted/revoked timestamps, and
  the reusable data categories any grant covers
- A "Revoke Consent" action that refreshes the list on success

**Milestone 5, Part 3 (Demo UX Polish):** a visual consistency pass —
no backend, schema, or API changes.

- A shared global stylesheet (`frontend/src/styles.css`, plain CSS, no
  framework) and a shared `NavBar` component used identically across
  Dashboard, Profile, Government Services, Applications, and Consent
  History, with active-route highlighting
- Consistent "Reusable OTR Data" vs "Application-Specific Data"
  labeling wherever the two appear side by side
- Responsive layout via CSS Grid, overflow safeguards on JSON blocks

**Milestone 5, Part 4 (Final E2E + Freeze):** this milestone.

- Manual end-to-end testing script (above) covering the complete flow
- Confirmed zero pending Drizzle schema changes/migrations (see
  "Schema freeze confirmation" above)
- Final documentation and milestone tracker update
- No application code was modified in this milestone

## Notes for Reviewers / Judges

- This is a finished prototype covering registration, a reusable OTR
  identity/profile/education/credentials/documents model, consent,
  interoperable mock-portal field mapping, application submission, a
  dashboard, and consent/access history.
- No real Aadhaar, DigiLocker, biometric, or government API
  integration exists or is claimed anywhere in this codebase — all
  portals, verification statuses, and identifiers are synthetic/demo
  constructs.
- Authentication is a prototype JWT scheme suitable for a local demo,
  not a production-grade security implementation.
- The strongest single demo to run live is the manual E2E script
  above, particularly steps 4–6, which show the same underlying OTR
  data being mapped into a mock portal's field names only after
  explicit consent, and that revoking consent is immediately reflected
  in Consent History.
