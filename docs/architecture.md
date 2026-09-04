# Architecture Notes — Milestone 1: Project Foundation

## Scope of this milestone

This milestone establishes only the project skeleton:

- React + TypeScript + Vite frontend
- Node.js + Express + TypeScript backend
- SQLite database wired through Drizzle ORM
- A single `GET /api/health` endpoint that also pings the database
- Frontend-to-backend HTTP communication over a configurable base URL

No domain features (OTR ID generation, profile, education,
credentials, documents, consent, applications, government portal
interoperability, dashboards, or audit logs) exist yet.

## Why this shape

- **Two independent npm projects, no monorepo tooling.** Keeps the
  setup simple and avoids introducing workspace tooling (Nx, Turborepo,
  npm workspaces) before there's enough code to justify it.
- **SQLite + Drizzle, no separate DB server.** Avoids running Postgres,
  Docker, or any external service for a prototype. The whole database
  is a single file at `database/otr.db`.
- **No microservices, queues, or caching layers.** A single Express
  process is more than sufficient for the current and near-term scope.
- **Health check pings the DB.** Rather than being a pure liveness
  check, `GET /api/health` runs a trivial `SELECT 1` through Drizzle so
  that this milestone proves the full request → API → database path
  works, not just that the HTTP server is up.

## Disclaimers

- This is an independent, non-production prototype built for a
  hackathon setting.
- No real Aadhaar, DigiLocker, biometric, or government API
  integration is used or implied anywhere in this codebase.
- All data is synthetic/demo data.
