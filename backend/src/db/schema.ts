/**
 * Drizzle ORM schema definitions.
 *
 * MILESTONE 1 (project foundation): intentionally left empty.
 * No tables for profile, education, credentials, documents, consent,
 * or applications are defined yet - those arrive in later milestones.
 *
 * This file exists now so that:
 *  - drizzle-kit has a valid schema entry point to point at
 *  - the Drizzle client in db/client.ts has something to type against
 *
 * Exporting an empty object keeps drizzle-orm's schema type happy
 * without introducing any real tables.
 */
export const schema = {};
