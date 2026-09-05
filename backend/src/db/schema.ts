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

export const schema = { users, profiles, education, credentials, documents };
