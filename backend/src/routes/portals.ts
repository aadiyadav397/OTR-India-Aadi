import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { portals } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";

export const portalsRouter = Router();

portalsRouter.use(requireAuth);

/**
 * GET /api/portals
 * Lists active mock government portals available in this prototype.
 * Fictional demo portals only - no real government services.
 */
portalsRouter.get("/", (_req, res) => {
  const activePortals = db.select().from(portals).where(eq(portals.active, true)).all();
  res.status(200).json({ portals: activePortals });
});
