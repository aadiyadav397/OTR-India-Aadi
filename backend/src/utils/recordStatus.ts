// Shared prototype "verification lifecycle" status, reused across
// education, credentials, and documents (see db/schema.ts). This is a
// demo concept only - no real government or issuer verification is
// performed anywhere in this codebase.

export const RECORD_STATUSES = [
  "USER_PROVIDED",
  "PENDING_VERIFICATION",
  "VERIFIED",
  "REJECTED",
  "EXPIRED",
  "REVOKED",
] as const;

export type RecordStatus = (typeof RECORD_STATUSES)[number];

export const DEFAULT_RECORD_STATUS: RecordStatus = "USER_PROVIDED";

export function isValidRecordStatus(value: unknown): value is RecordStatus {
  return typeof value === "string" && (RECORD_STATUSES as readonly string[]).includes(value);
}
