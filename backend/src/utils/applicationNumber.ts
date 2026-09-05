import { randomInt } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { applications } from "../db/schema";

// Same alphabet as OTR IDs (see auth/otrId.ts) - excludes visually
// ambiguous characters (0/O, 1/I) for a human-readable demo identifier.
const APPLICATION_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const APPLICATION_ID_LENGTH = 8;
const MAX_GENERATION_ATTEMPTS = 10;

/**
 * Derives a short demo prefix from a portal code, e.g.
 * "SCHOLARSHIP" -> "SCH", "EMPLOYMENT" -> "EMP".
 */
function prefixFromPortalCode(portalCode: string): string {
  return portalCode.slice(0, 3).toUpperCase();
}

/**
 * Generates a unique demo application number, e.g. "APP-SCH-7F3K9QZP".
 *
 * Uses Node's crypto.randomInt (cryptographically secure) - NOT derived
 * from Aadhaar, phone, email, date of birth, or any other personal data.
 */
export function generateUniqueApplicationNumber(portalCode: string): string {
  const prefix = prefixFromPortalCode(portalCode);

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    let suffix = "";
    for (let i = 0; i < APPLICATION_ID_LENGTH; i++) {
      suffix += APPLICATION_ID_ALPHABET[randomInt(0, APPLICATION_ID_ALPHABET.length)];
    }
    const candidate = `APP-${prefix}-${suffix}`;

    const existing = db
      .select()
      .from(applications)
      .where(eq(applications.applicationNumber, candidate))
      .get();
    if (!existing) return candidate;
  }

  throw new Error("Failed to generate a unique application number after multiple attempts");
}
