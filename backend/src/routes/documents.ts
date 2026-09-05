import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { documents } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";
import { validateDocumentInput } from "../utils/validation";

export const documentsRouter = Router();

documentsRouter.use(requireAuth);

function parseRecordId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * GET /api/documents
 * Lists the authenticated user's own document metadata only.
 */
documentsRouter.get("/", (req, res) => {
  const records = db.select().from(documents).where(eq(documents.userId, req.userId!)).all();
  res.status(200).json({ documents: records });
});

/**
 * POST /api/documents
 * Creates a new document METADATA record for the authenticated user.
 * This prototype does not upload, store, or persist any actual file -
 * only reference fields (fileName/fileReference/mimeType/fileSize) are
 * recorded. Always starts at verificationStatus = USER_PROVIDED.
 */
documentsRouter.post("/", (req, res) => {
  const { valid, errors, data } = validateDocumentInput(req.body, { partial: false });
  if (!valid || !data) {
    res.status(400).json({ error: "Invalid document data.", details: errors });
    return;
  }

  const now = new Date().toISOString();
  const inserted = db
    .insert(documents)
    .values({
      userId: req.userId!,
      documentType: data.documentType!,
      documentName: data.documentName!,
      fileName: data.fileName ?? null,
      fileReference: data.fileReference ?? null,
      mimeType: data.mimeType ?? null,
      fileSize: data.fileSize ?? null,
      verificationStatus: data.verificationStatus!,
      uploadedAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  res.status(201).json({ document: inserted });
});

/**
 * PATCH /api/documents/:id
 * Updates document metadata, including verificationStatus. This never
 * performs real verification - it only stores/updates the prototype
 * lifecycle status. Only the owning user may update it.
 */
documentsRouter.patch("/:id", (req, res) => {
  const id = parseRecordId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid document record id." });
    return;
  }

  const { valid, errors, data } = validateDocumentInput(req.body, { partial: true });
  if (!valid || !data) {
    res.status(400).json({ error: "Invalid document data.", details: errors });
    return;
  }

  const existing = db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, req.userId!)))
    .get();
  if (!existing) {
    res.status(404).json({ error: "Document record not found." });
    return;
  }

  const updated = db
    .update(documents)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(and(eq(documents.id, id), eq(documents.userId, req.userId!)))
    .returning()
    .get();

  res.status(200).json({ document: updated });
});

/**
 * DELETE /api/documents/:id
 * Deletes a document metadata record. Only the owning user may delete it.
 */
documentsRouter.delete("/:id", (req, res) => {
  const id = parseRecordId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid document record id." });
    return;
  }

  const existing = db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, req.userId!)))
    .get();
  if (!existing) {
    res.status(404).json({ error: "Document record not found." });
    return;
  }

  db.delete(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, req.userId!)))
    .run();

  res.status(204).send();
});
