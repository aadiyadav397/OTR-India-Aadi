import dotenv from "dotenv";
import path from "path";

dotenv.config();

/**
 * Central place for environment configuration.
 * Keep this file simple - no validation library needed for a prototype
 * with a handful of variables. Revisit if the config surface grows.
 */

// JWT_SECRET must be set via backend/.env (copied from .env.example).
// Intentionally not hardcoded here - failing fast is preferable to a
// silent, predictable fallback secret for anything touching auth.
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error(
    "Missing JWT_SECRET environment variable. Copy backend/.env.example to " +
      "backend/.env and set JWT_SECRET before starting the server."
  );
}

export const env = {
  PORT: Number(process.env.PORT ?? 4000),
  // Path is relative to the backend/ working directory by default,
  // pointing at the shared database/ folder at the repo root.
  DATABASE_URL:
    process.env.DATABASE_URL ?? path.resolve(__dirname, "../../../database/otr.db"),
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  JWT_SECRET: jwtSecret,
  // Demo-friendly default so testers/evaluators don't get logged out mid-review.
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
};
