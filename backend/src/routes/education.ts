import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { education } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";
import { validateEducationInput } from "../utils/validation";

export const educationRouter = Router();

educationRouter.use(requireAuth);

function parseRecordId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * GET /api/education
 * Lists the authenticated user's own education records only.
 */
educationRouter.get("/", (req, res) => {
  const records = db.select().from(education).where(eq(education.userId, req.userId!)).all();
  res.status(200).json({ education: records });
});

/**
 * POST /api/education
 * Creates a new reusable education record for the authenticated user.
 * Not tied to any government application.
 */
educationRouter.post("/", (req, res) => {
  const { valid, errors, data } = validateEducationInput(req.body, { partial: false });
  if (!valid || !data) {
    res.status(400).json({ error: "Invalid education data.", details: errors });
    return;
  }

  const now = new Date().toISOString();
  const inserted = db
    .insert(education)
    .values({
      userId: req.userId!,
      institution: data.institution!,
      degreeOrQualification: data.degreeOrQualification!,
      fieldOfStudy: data.fieldOfStudy!,
      startYear: data.startYear!,
      endYear: data.endYear ?? null,
      status: data.status!,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  res.status(201).json({ education: inserted });
});

/**
 * PATCH /api/education/:id
 * Updates an education record. Only the owning user may update it -
 * records belonging to another user return 404 (not 403) so their
 * existence is never revealed.
 */
educationRouter.patch("/:id", (req, res) => {
  const id = parseRecordId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid education record id." });
    return;
  }

  const { valid, errors, data } = validateEducationInput(req.body, { partial: true });
  if (!valid || !data) {
    res.status(400).json({ error: "Invalid education data.", details: errors });
    return;
  }

  const existing = db
    .select()
    .from(education)
    .where(and(eq(education.id, id), eq(education.userId, req.userId!)))
    .get();
  if (!existing) {
    res.status(404).json({ error: "Education record not found." });
    return;
  }

  const updated = db
    .update(education)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(and(eq(education.id, id), eq(education.userId, req.userId!)))
    .returning()
    .get();

  res.status(200).json({ education: updated });
});

/**
 * DELETE /api/education/:id
 * Deletes an education record. Only the owning user may delete it.
 */
educationRouter.delete("/:id", (req, res) => {
  const id = parseRecordId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid education record id." });
    return;
  }

  const existing = db
    .select()
    .from(education)
    .where(and(eq(education.id, id), eq(education.userId, req.userId!)))
    .get();
  if (!existing) {
    res.status(404).json({ error: "Education record not found." });
    return;
  }

  db.delete(education)
    .where(and(eq(education.id, id), eq(education.userId, req.userId!)))
    .run();

  res.status(204).send();
});
