// Consent lifecycle for Milestone 4. Intentionally simple - no
// versioning, no field-level granularity. A user either has an active
// (GRANTED) consent for a portal, or they don't.

export const CONSENT_STATUSES = ["GRANTED", "REVOKED"] as const;

export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

export function isValidConsentStatus(value: unknown): value is ConsentStatus {
  return typeof value === "string" && (CONSENT_STATUSES as readonly string[]).includes(value);
}
