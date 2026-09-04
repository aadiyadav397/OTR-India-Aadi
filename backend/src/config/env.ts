import dotenv from "dotenv";
import path from "path";

dotenv.config();

/**
 * Central place for environment configuration.
 * Keep this file simple - no validation library needed for a prototype
 * with only two variables. Revisit if the config surface grows.
 */
export const env = {
  PORT: Number(process.env.PORT ?? 4000),
  // Path is relative to the backend/ working directory by default,
  // pointing at the shared database/ folder at the repo root.
  DATABASE_URL:
    process.env.DATABASE_URL ?? path.resolve(__dirname, "../../../database/otr.db"),
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
};
