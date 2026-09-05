import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { credentials } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";
import { validateCredentialInput } from "../utils/validation";

export const credentialsRouter = Router();

credentialsRouter.use(requireAuth);

function parseRecordId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * GET /api/credentials
 * Lists the authenticated user's own credentials only.
 */
credentialsRouter.get("/", (req, res) => {
  const records = db.select().from(credentials).where(eq(credentials.userId, req.userId!)).all();
  res.status(200).json({ credentials: records });
});

/**
 * POST /api/credentials
 * Creates a new reusable credential record for the authenticated user.
 * Not tied to any government application.
 */
credentialsRouter.post("/", (req, res) => {
  const { valid, errors, data } = validateCredentialInput(req.body, { partial: false });
  if (!valid || !data) {
    res.status(400).json({ error: "Invalid credential data.", details: errors });
    return;
  }

  const now = new Date().toISOString();
  const inserted = db
    .insert(credentials)
    .values({
      userId: req.userId!,
      title: data.title!,
      type: data.type!,
      issuer: data.issuer!,
      credentialId: data.credentialId ?? null,
      issueDate: data.issueDate!,
      expiryDate: data.expiryDate ?? null,
      status: data.status!,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  res.status(201).json({ credential: inserted });
});

/**
 * PATCH /api/credentials/:id
 * Updates a credential record. Only the owning user may update it -
 * records belonging to another user return 404 (not 403) so their
 * existence is never revealed.
 */
credentialsRouter.patch("/:id", (req, res) => {
  const id = parseRecordId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid credential record id." });
    return;
  }

  const { valid, errors, data } = validateCredentialInput(req.body, { partial: true });
  if (!valid || !data) {
    res.status(400).json({ error: "Invalid credential data.", details: errors });
    return;
  }

  const existing = db
    .select()
    .from(credentials)
    .where(and(eq(credentials.id, id), eq(credentials.userId, req.userId!)))
    .get();
  if (!existing) {
    res.status(404).json({ error: "Credential record not found." });
    return;
  }

  const updated = db
    .update(credentials)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(and(eq(credentials.id, id), eq(credentials.userId, req.userId!)))
    .returning()
    .get();

  res.status(200).json({ credential: updated });
});

/**
 * DELETE /api/credentials/:id
 * Deletes a credential record. Only the owning user may delete it.
 */
credentialsRouter.delete("/:id", (req, res) => {
  const id = parseRecordId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid credential record id." });
    return;
  }

  const existing = db
    .select()
    .from(credentials)
    .where(and(eq(credentials.id, id), eq(credentials.userId, req.userId!)))
    .get();
  if (!existing) {
    res.status(404).json({ error: "Credential record not found." });
    return;
  }

  db.delete(credentials)
    .where(and(eq(credentials.id, id), eq(credentials.userId, req.userId!)))
    .run();

  res.status(204).send();
});
