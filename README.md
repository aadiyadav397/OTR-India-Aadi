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

## Milestone Status

**Milestone 1 (Project Foundation):** complete — frontend/backend/database
wiring and a health-check endpoint.

**Milestone 2 (Registration, Login, OTR Profile):** complete — this adds:

- User registration with email + password (bcrypt-hashed, never stored
  or returned in plaintext)
- Login returning a prototype JWT session token
- OTR ID generation — an 8-character random demo identifier
  (`OTR-XXXXXXXX`) generated from cryptographically random data only,
  **not** derived from email, phone, date of birth, or any government
  identifier
- A basic citizen profile (full name, date of birth, mobile number)
  linked 1:1 to a user
- Authenticated `GET /api/profile` and `PATCH /api/profile`
- Minimal Register / Login / Profile screens in the frontend, with a
  logout action and route protection on `/profile`

Features such as OTP, education, credentials, documents, consent,
government portal integration, applications, dashboards, and audit logs
are **not yet implemented** — they belong to later milestones.

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

## Prerequisites

- Node.js 18+ and npm

## Running the Backend

```bash
cd backend
cp .env.example .env    # first time only
npm install
npm run dev
```

The API server starts on **http://localhost:4000**.

Verify it's working:

```bash
curl http://localhost:4000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "otr-india-backend",
  "db": "connected",
  "timestamp": "2026-09-04T00:00:00.000Z"
}
```

On first run, the backend automatically creates the SQLite database
file at `database/otr.db` if it doesn't already exist.

### Backend scripts

| Script             | Purpose                                         |
| ------------------ | ------------------------------------------------ |
| `npm run dev`       | Start the API server in watch mode              |
| `npm run build`     | Compile TypeScript to `dist/`                   |
| `npm start`         | Run the compiled server (`dist/index.js`)        |
| `npm run db:generate` | Generate Drizzle migration files from the schema |
| `npm run db:migrate`  | Apply migrations to the SQLite database        |

## Running the Frontend

In a separate terminal:

```bash
cd frontend
cp .env.example .env    # first time only
npm install
npm run dev
```

The app starts on **http://localhost:5173** and calls the backend
health endpoint on load to confirm connectivity.

### Frontend scripts

| Script          | Purpose                          |
| ---------------- | --------------------------------- |
| `npm run dev`     | Start the Vite dev server        |
| `npm run build`   | Type-check and build for production |
| `npm run preview` | Preview the production build locally |

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
The value shipped in `.env.example` is a demo placeholder only.

**`frontend/.env`** (see `frontend/.env.example`)

```
VITE_API_BASE_URL=http://localhost:4000
```

## Notes for Reviewers / Judges

- No authentication, OTP, or real identity verification is implemented
  in this milestone.
- No government portal integrations exist; this is a scoped
  architectural foundation only.
- The Drizzle schema (`backend/src/db/schema.ts`) is intentionally
  empty at this stage — it exists so the database wiring can be proven
  end-to-end (via the health check's DB ping) before real tables are
  introduced in later milestones.
