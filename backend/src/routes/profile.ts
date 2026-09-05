import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { users, profiles } from "../db/schema";
import { requireAuth } from "../middleware/requireAuth";
import { validateProfileUpdateInput } from "../utils/validation";

export const profileRouter = Router();

profileRouter.use(requireAuth);

function findProfileWithEmail(userId: number) {
  return db
    .select({
      otrId: profiles.otrId,
      fullName: profiles.fullName,
      dateOfBirth: profiles.dateOfBirth,
      mobileNumber: profiles.mobileNumber,
      createdAt: profiles.createdAt,
      updatedAt: profiles.updatedAt,
      email: users.email,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(eq(profiles.userId, userId))
    .get();
}

/**
 * GET /api/profile
 * Returns the authenticated user's OTR profile, including email
 * (joined from users) for display purposes. Requires authentication.
 */
profileRouter.get("/", (req, res) => {
  const profile = findProfileWithEmail(req.userId!);

  if (!profile) {
    res.status(404).json({ error: "Profile not found." });
    return;
  }

  res.status(200).json({ profile });
});

/**
 * PATCH /api/profile
 * Updates only fullName, dateOfBirth, and/or mobileNumber for the
 * authenticated user's profile. otrId, email, and userId are immutable
 * through this endpoint. Requires authentication.
 */
profileRouter.patch("/", (req, res) => {
  const { valid, errors, data } = validateProfileUpdateInput(req.body);
  if (!valid || !data) {
    res.status(400).json({ error: "Invalid profile update data.", details: errors });
    return;
  }

  const existing = db.select().from(profiles).where(eq(profiles.userId, req.userId!)).get();
  if (!existing) {
    res.status(404).json({ error: "Profile not found." });
    return;
  }

  db.update(profiles)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(profiles.userId, req.userId!))
    .run();

  const updated = findProfileWithEmail(req.userId!);
  res.status(200).json({ profile: updated });
});
