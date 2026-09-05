import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { consents, portals } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";
import { validatePortalIdInput } from "../utils/validation";

export const consentsRouter = Router();

consentsRouter.use(requireAuth);

function parseRecordId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Finds the most recent consent for (userId, portalId), if any.
 * Used to decide whether reusable OTR data may currently be shared
 * with that portal - a revoked consent must not authorize new sharing.
 */
export function findLatestConsent(userId: number, portalId: number) {
  return db
    .select()
    .from(consents)
    .where(and(eq(consents.userId, userId), eq(consents.portalId, portalId)))
    .orderBy(desc(consents.id))
    .get();
}

/**
 * GET /api/consents
 * Lists the authenticated user's own consent history (all portals,
 * both granted and revoked), most recent first.
 */
consentsRouter.get("/", (req, res) => {
  const records = db
    .select()
    .from(consents)
    .where(eq(consents.userId, req.userId!))
    .orderBy(desc(consents.id))
    .all();
  res.status(200).json({ consents: records });
});

/**
 * POST /api/consents
 * Explicitly grants consent for the authenticated user to share
 * reusable OTR data with a specific portal. The frontend must show the
 * user what will be shared BEFORE calling this endpoint - this route
 * only persists the user's decision, it does not share any data itself.
 */
consentsRouter.post("/", (req, res) => {
  const { valid, errors, data } = validatePortalIdInput(req.body);
  if (!valid || !data) {
    res.status(400).json({ error: "Invalid consent data.", details: errors });
    return;
  }

  const portal = db.select().from(portals).where(eq(portals.id, data.portalId)).get();
  if (!portal || !portal.active) {
    res.status(404).json({ error: "Portal not found." });
    return;
  }

  const now = new Date().toISOString();
  const inserted = db
    .insert(consents)
    .values({
      userId: req.userId!,
      portalId: data.portalId,
      status: "GRANTED",
      grantedAt: now,
      revokedAt: null,
      createdAt: now,
    })
    .returning()
    .get();

  res.status(201).json({ consent: inserted });
});

/**
 * POST /api/consents/:id/revoke
 * Revokes a previously granted consent. Idempotent - revoking an
 * already-revoked consent simply returns its current state. After
 * revocation, application preview/submission for that portal will no
 * longer treat this consent as active.
 */
consentsRouter.post("/:id/revoke", (req, res) => {
  const id = parseRecordId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid consent id." });
    return;
  }

  const existing = db
    .select()
    .from(consents)
    .where(and(eq(consents.id, id), eq(consents.userId, req.userId!)))
    .get();
  if (!existing) {
    res.status(404).json({ error: "Consent record not found." });
    return;
  }

  if (existing.status === "REVOKED") {
    res.status(200).json({ consent: existing });
    return;
  }

  const updated = db
    .update(consents)
    .set({ status: "REVOKED", revokedAt: new Date().toISOString() })
    .where(and(eq(consents.id, id), eq(consents.userId, req.userId!)))
    .returning()
    .get();

  res.status(200).json({ consent: updated });
});
