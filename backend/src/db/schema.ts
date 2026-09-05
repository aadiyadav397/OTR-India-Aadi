import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

/**
 * Drizzle ORM schema definitions.
 *
 * MILESTONE 3 adds: education, credentials, documents.
 * These are reusable OTR records tied to a user only - NOT tied to any
 * particular government application. Application-specific data,
 * consent, portal mapping, and interoperability arrive in later
 * milestones.
 *
 * No tables for consent, portals, applications, or audit history are
 * defined yet.
 */

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const profiles = sqliteTable("profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // One profile per user. Unique constraint enforces the 1:1 relationship.
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  // Reusable demo identity string, e.g. "OTR-7F3K9QZP".
  // Generated from cryptographically random data only - see src/auth/otrId.ts.
  // Never derived from email, phone, DOB, or any government identifier.
  otrId: text("otr_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  mobileNumber: text("mobile_number").notNull(),
  // Added in Milestone 4 - reusable OTR data shared with mock portals
  // (e.g. mapped to "residentialAddress" / "currentAddress"). Nullable
  // since existing Milestone 2/3 profiles were created without it.
  address: text("address"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/**
 * MILESTONE 3: reusable education, credential, and document metadata.
 *
 * All three tables share the same prototype "verification lifecycle"
 * status concept (see src/utils/recordStatus.ts):
 *   USER_PROVIDED | PENDING_VERIFICATION | VERIFIED | REJECTED | EXPIRED | REVOKED
 * This is a demo concept only - no real government verification occurs.
 * New records default to USER_PROVIDED.
 *
 * These records belong to a user (not a profile, and not any specific
 * government application) so they can be reused across future
 * application submissions without duplication.
 */

export const education = sqliteTable("education", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  institution: text("institution").notNull(),
  degreeOrQualification: text("degree_or_qualification").notNull(),
  fieldOfStudy: text("field_of_study").notNull(),
  startYear: integer("start_year").notNull(),
  endYear: integer("end_year"),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const credentials = sqliteTable("credentials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  type: text("type").notNull(),
  issuer: text("issuer").notNull(),
  credentialId: text("credential_id"),
  issueDate: text("issue_date").notNull(),
  expiryDate: text("expiry_date"),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  documentType: text("document_type").notNull(),
  documentName: text("document_name").notNull(),
  // Metadata/reference only - no real file storage in this prototype.
  fileName: text("file_name"),
  fileReference: text("file_reference"),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  verificationStatus: text("verification_status").notNull(),
  uploadedAt: text("uploaded_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/**
 * MILESTONE 4: mock government portals, portal field mappings, consent,
 * and applications.
 *
 * Demonstrates interoperability: the SAME reusable OTR data (profile +
 * education + credentials) is mapped into DIFFERENT portal-specific
 * field names via portalFieldMappings, only after the user has
 * explicitly granted consent for that portal.
 *
 * This is a fictional demo. No real government portals, Aadhaar,
 * DigiLocker, or biometric systems are integrated anywhere.
 */

export const portals = sqliteTable("portals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  // Short machine-readable identifier, e.g. "SCHOLARSHIP", "EMPLOYMENT".
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});

/**
 * Maps a canonical OTR field name (e.g. "fullName") to a portal-specific
 * field name (e.g. "applicantName" for Portal A, "candidateName" for
 * Portal B). Reading this table at request time - rather than hardcoding
 * per-portal transformation branches in route handlers - is what lets
 * new portals or new canonical fields be added by inserting rows.
 */
export const portalFieldMappings = sqliteTable("portal_field_mappings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  portalId: integer("portal_id")
    .notNull()
    .references(() => portals.id),
  // Canonical OTR field key: fullName | dateOfBirth | mobileNumber |
  // email | address | educationRecords | credentials
  otrField: text("otr_field").notNull(),
  // This portal's own name for that same piece of data.
  portalField: text("portal_field").notNull(),
});

export const consents = sqliteTable("consents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  portalId: integer("portal_id")
    .notNull()
    .references(() => portals.id),
  // GRANTED | REVOKED - see src/utils/consentStatus.ts.
  // Intentionally no consent versioning/field-level granularity for
  // this prototype - a single grant/revoke per (user, portal) pair.
  status: text("status").notNull(),
  grantedAt: text("granted_at").notNull(),
  revokedAt: text("revoked_at"),
  createdAt: text("created_at").notNull(),
});

export const applications = sqliteTable("applications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  portalId: integer("portal_id")
    .notNull()
    .references(() => portals.id),
  consentId: integer("consent_id")
    .notNull()
    .references(() => consents.id),
  // Demo-friendly unique identifier, e.g. "APP-SCH-7F3K9QZP".
  // Generated from cryptographically random data only - never derived
  // from Aadhaar, phone, email, DOB, or other personal data.
  applicationNumber: text("application_number").notNull().unique(),
  // DRAFT | SUBMITTED - see src/utils/applicationStatus.ts.
  status: text("status").notNull(),
  // JSON text blob: the portal-mapped + application-specific fields the
  // user actually submitted. SQLite has no native JSON column type, so
  // this is stored as TEXT and parsed/stringified in the route layer.
  applicationData: text("application_data").notNull(),
  submittedAt: text("submitted_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const schema = {
  users,
  profiles,
  education,
  credentials,
  documents,
  portals,
  portalFieldMappings,
  consents,
  applications,
};
