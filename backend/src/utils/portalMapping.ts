import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { users, profiles, education, credentials, portalFieldMappings } from "../db/schema";

/**
 * The canonical set of reusable OTR fields that may be shared with a
 * portal, matching the categories shown on the consent screen:
 *   Basic profile        -> fullName, dateOfBirth
 *   Contact information   -> mobileNumber, email
 *   Address                -> address
 *   Education records      -> educationRecords
 *   Selected credentials    -> credentials
 *
 * Document metadata is intentionally NOT part of this reusable set for
 * Milestone 4 (not shown on the consent screen, not mapped to portals).
 */
export interface CanonicalOtrData {
  fullName: string;
  dateOfBirth: string;
  mobileNumber: string;
  email: string;
  address: string | null;
  educationRecords: Array<{
    institution: string;
    degreeOrQualification: string;
    fieldOfStudy: string;
    startYear: number;
    endYear: number | null;
    status: string;
  }>;
  credentials: Array<{
    title: string;
    type: string;
    issuer: string;
    credentialId: string | null;
    issueDate: string;
    expiryDate: string | null;
    status: string;
  }>;
}

/**
 * Gathers the authenticated user's reusable OTR data into one canonical
 * shape. This is the single source of truth read by every portal
 * mapping - portals never read profile/education/credentials tables
 * directly.
 */
export function buildCanonicalOtrData(userId: number): CanonicalOtrData | null {
  const profileRow = db
    .select({
      fullName: profiles.fullName,
      dateOfBirth: profiles.dateOfBirth,
      mobileNumber: profiles.mobileNumber,
      address: profiles.address,
      email: users.email,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(eq(profiles.userId, userId))
    .get();

  if (!profileRow) return null;

  const educationRows = db.select().from(education).where(eq(education.userId, userId)).all();
  const credentialRows = db.select().from(credentials).where(eq(credentials.userId, userId)).all();

  return {
    fullName: profileRow.fullName,
    dateOfBirth: profileRow.dateOfBirth,
    mobileNumber: profileRow.mobileNumber,
    email: profileRow.email,
    address: profileRow.address,
    educationRecords: educationRows.map((r) => ({
      institution: r.institution,
      degreeOrQualification: r.degreeOrQualification,
      fieldOfStudy: r.fieldOfStudy,
      startYear: r.startYear,
      endYear: r.endYear,
      status: r.status,
    })),
    credentials: credentialRows.map((c) => ({
      title: c.title,
      type: c.type,
      issuer: c.issuer,
      credentialId: c.credentialId,
      issueDate: c.issueDate,
      expiryDate: c.expiryDate,
      status: c.status,
    })),
  };
}

/**
 * Applies a portal's field mappings (read from portal_field_mappings)
 * to canonical OTR data, producing a portal-specific prefilled object.
 *
 * This is intentionally data-driven: adding a new portal or a new
 * canonical field means inserting rows into portal_field_mappings, not
 * writing new per-portal branching logic here.
 */
export function mapCanonicalDataToPortalFields(
  canonicalData: CanonicalOtrData,
  portalId: number
): Record<string, unknown> {
  const mappings = db
    .select()
    .from(portalFieldMappings)
    .where(eq(portalFieldMappings.portalId, portalId))
    .all();

  const prefilled: Record<string, unknown> = {};
  const canonicalRecord = canonicalData as unknown as Record<string, unknown>;

  for (const mapping of mappings) {
    if (mapping.otrField in canonicalRecord) {
      prefilled[mapping.portalField] = canonicalRecord[mapping.otrField];
    }
  }

  return prefilled;
}
