import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { users, profiles } from "../db/schema";
import { hashPassword, verifyPassword } from "../auth/password";
import { signAuthToken } from "../auth/jwt";
import { generateUniqueOtrId } from "../auth/otrId";
import { requireAuth } from "../middleware/requireAuth";
import { validateRegistrationInput, validateLoginInput } from "../utils/validation";

export const authRouter = Router();

function toSafeUser(user: typeof users.$inferSelect) {
  // Never expose password_hash in API responses.
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * POST /api/auth/register
 * Creates a user, generates an OTR ID, creates a basic profile,
 * and returns an auth token plus safe user/profile info.
 */
authRouter.post("/register", (req, res) => {
  const { valid, errors, data } = validateRegistrationInput(req.body);
  if (!valid || !data) {
    res.status(400).json({ error: "Invalid registration data.", details: errors });
    return;
  }

  const existing = db.select().from(users).where(eq(users.email, data.email)).get();
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const now = new Date().toISOString();
  const passwordHash = hashPassword(data.password);

  const insertedUser = db
    .insert(users)
    .values({
      email: data.email,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  const otrId = generateUniqueOtrId();

  const insertedProfile = db
    .insert(profiles)
    .values({
      userId: insertedUser.id,
      otrId,
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      mobileNumber: data.mobileNumber,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  const token = signAuthToken({ userId: insertedUser.id });

  res.status(201).json({
    token,
    user: toSafeUser(insertedUser),
    profile: {
      otrId: insertedProfile.otrId,
      fullName: insertedProfile.fullName,
      dateOfBirth: insertedProfile.dateOfBirth,
      mobileNumber: insertedProfile.mobileNumber,
    },
  });
});

/**
 * POST /api/auth/login
 * Verifies credentials and returns a fresh auth token.
 * Never returns password data. Uses a generic error message on
 * failure so callers cannot distinguish "no such email" from
 * "wrong password".
 */
authRouter.post("/login", (req, res) => {
  const { valid, errors, data } = validateLoginInput(req.body);
  if (!valid || !data) {
    res.status(400).json({ error: "Invalid login data.", details: errors });
    return;
  }

  const user = db.select().from(users).where(eq(users.email, data.email)).get();
  if (!user || !verifyPassword(data.password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const token = signAuthToken({ userId: user.id });

  res.status(200).json({
    token,
    user: toSafeUser(user),
  });
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's safe profile-less info.
 * (Full profile fields live under GET /api/profile.)
 */
authRouter.get("/me", requireAuth, (req, res) => {
  const user = db.select().from(users).where(eq(users.id, req.userId!)).get();
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  res.status(200).json({ user: toSafeUser(user) });
});
