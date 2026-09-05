// Application lifecycle for Milestone 4. Only SUBMITTED is created by
// the current API (POST /api/applications submits immediately) - DRAFT
// is reserved for a possible future "save for later" flow.

export const APPLICATION_STATUSES = ["DRAFT", "SUBMITTED"] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export function isValidApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === "string" && (APPLICATION_STATUSES as readonly string[]).includes(value);
}
