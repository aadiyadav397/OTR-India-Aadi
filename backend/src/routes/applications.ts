import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { applications, portals } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";
import { validatePortalIdInput, validateApplicationSubmitInput } from "../utils/validation";
import { buildCanonicalOtrData, mapCanonicalDataToPortalFields } from "../utils/portalMapping";
import { generateUniqueApplicationNumber } from "../utils/applicationNumber";
import { findLatestConsent } from "./consents";

export const applicationsRouter = Router();

applicationsRouter.use(requireAuth);

function parseRecordId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function serializeApplication(row: typeof applications.$inferSelect) {
  // applicationData is stored as a JSON text blob (SQLite has no native
  // JSON column) - parse it back out for API responses.
  return { ...row, applicationData: JSON.parse(row.applicationData) as unknown };
}

/**
 * POST /api/applications/preview
 * Verifies the user, the portal, and an ACTIVE (granted, not revoked)
 * consent for that portal, then maps reusable OTR data into the
 * portal's own field names. Does NOT create or persist an application -
 * this is preview only.
 */
applicationsRouter.post("/preview", (req, res) => {
  const { valid, errors, data } = validatePortalIdInput(req.body);
  if (!valid || !data) {
    res.status(400).json({ error: "Invalid preview request.", details: errors });
    return;
  }

  const portal = db.select().from(portals).where(eq(portals.id, data.portalId)).get();
  if (!portal || !portal.active) {
    res.status(404).json({ error: "Portal not found." });
    return;
  }

  const consent = findLatestConsent(req.userId!, data.portalId);
  if (!consent || consent.status !== "GRANTED") {
    res.status(403).json({
      error: "Active consent is required before previewing an application for this portal.",
    });
    return;
  }

  const canonicalData = buildCanonicalOtrData(req.userId!);
  if (!canonicalData) {
    res.status(404).json({ error: "Profile not found." });
    return;
  }

  const prefilled = mapCanonicalDataToPortalFields(canonicalData, data.portalId);

  res.status(200).json({
    portal: { id: portal.id, name: portal.name, code: portal.code },
    consentId: consent.id,
    prefilled,
  });
});

/**
 * POST /api/applications
 * Submits an application. Requires the same active-consent check as
 * preview. Accepts the portal-mapped data (from preview) plus any
 * application-specific fields the user added on top - this route does
 * not distinguish between the two, it just persists whatever object the
 * frontend sends as applicationData.
 */
applicationsRouter.post("/", (req, res) => {
  const { valid, errors, data } = validateApplicationSubmitInput(req.body);
  if (!valid || !data) {
    res.status(400).json({ error: "Invalid application data.", details: errors });
    return;
  }

  const portal = db.select().from(portals).where(eq(portals.id, data.portalId)).get();
  if (!portal || !portal.active) {
    res.status(404).json({ error: "Portal not found." });
    return;
  }

  const consent = findLatestConsent(req.userId!, data.portalId);
  if (!consent || consent.status !== "GRANTED") {
    res.status(403).json({
      error: "Active consent is required before submitting an application for this portal.",
    });
    return;
  }

  const applicationNumber = generateUniqueApplicationNumber(portal.code);
  const now = new Date().toISOString();

  const inserted = db
    .insert(applications)
    .values({
      userId: req.userId!,
      portalId: data.portalId,
      consentId: consent.id,
      applicationNumber,
      status: "SUBMITTED",
      applicationData: JSON.stringify(data.applicationData),
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  res.status(201).json({ application: serializeApplication(inserted) });
});

/**
 * GET /api/applications
 * Lists the authenticated user's own applications only, most recent
 * first. Never exposes another user's applications.
 */
applicationsRouter.get("/", (req, res) => {
  const rows = db
    .select()
    .from(applications)
    .where(eq(applications.userId, req.userId!))
    .orderBy(desc(applications.id))
    .all();

  res.status(200).json({ applications: rows.map(serializeApplication) });
});

/**
 * GET /api/applications/:id
 * Returns a single application, but ONLY if it belongs to the
 * authenticated user. Records belonging to another user return 404,
 * not 403, so their existence is never revealed.
 */
applicationsRouter.get("/:id", (req, res) => {
  const id = parseRecordId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid application id." });
    return;
  }

  const row = db
    .select()
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, req.userId!)))
    .get();

  if (!row) {
    res.status(404).json({ error: "Application not found." });
    return;
  }

  res.status(200).json({ application: serializeApplication(row) });
});
