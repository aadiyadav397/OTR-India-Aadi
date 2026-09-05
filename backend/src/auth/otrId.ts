import { randomInt } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { profiles } from "../db/schema";

// Excludes visually ambiguous characters (0/O, 1/I) to keep the demo
// identifier easy for a human to read and re-type.
const OTR_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const OTR_ID_LENGTH = 8;
const MAX_GENERATION_ATTEMPTS = 10;

/**
 * Generates a single random OTR ID candidate, e.g. "OTR-7F3K9QZP".
 *
 * Uses Node's crypto.randomInt (cryptographically secure) - NOT derived
 * from email, phone, date of birth, or any government identifier.
 */
function generateOtrIdCandidate(): string {
  let suffix = "";
  for (let i = 0; i < OTR_ID_LENGTH; i++) {
    suffix += OTR_ID_ALPHABET[randomInt(0, OTR_ID_ALPHABET.length)];
  }
  return `OTR-${suffix}`;
}

/**
 * Generates an OTR ID guaranteed to be unique against the profiles table
 * at generation time, retrying on the rare collision.
 */
export function generateUniqueOtrId(): string {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const candidate = generateOtrIdCandidate();
    const existing = db.select().from(profiles).where(eq(profiles.otrId, candidate)).get();
    if (!existing) {
      return candidate;
    }
  }
  throw new Error("Failed to generate a unique OTR ID after multiple attempts");
}
