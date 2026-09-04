import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { env } from "../config/env";
import { schema } from "./schema";

// Make sure the database/ directory exists before SQLite tries to create the file.
const dbDir = path.dirname(env.DATABASE_URL);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(env.DATABASE_URL);

// Reasonable SQLite defaults for a small local prototype.
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

/**
 * Simple connectivity check used by GET /api/health.
 * Runs a trivial query to confirm the SQLite connection is alive.
 */
export function pingDatabase(): boolean {
  try {
    db.get(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}
