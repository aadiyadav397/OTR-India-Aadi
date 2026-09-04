import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./client";

/**
 * Applies pending Drizzle migrations from database/migrations to the
 * SQLite database configured in db/client.ts.
 *
 * Intentionally minimal: no CLI flags, no seeding, no rollback tooling.
 * When the schema is still empty (as in Milestone 1), this runs
 * against an empty migrations folder and is a no-op.
 *
 * Usage: npm run db:migrate
 */
migrate(db, { migrationsFolder: "../database/migrations" });

// eslint-disable-next-line no-console
console.log("[otr-india-backend] migrations applied (or none pending)");
