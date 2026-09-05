import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

/**
 * Drizzle ORM schema definitions.
 *
 * MILESTONE 2: users + profiles only.
 * No tables for education, credentials, documents, consent, or
 * applications are defined yet - those arrive in later milestones.
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

export const schema = { users, profiles };
