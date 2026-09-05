import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthTokenPayload {
  userId: number;
}

/**
 * Signs a prototype auth token. Simple JWT-based session mechanism -
 * no refresh tokens, no rotation, no revocation list. Sufficient for
 * a demo, not a production auth system.
 */
export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

/**
 * Verifies and decodes a prototype auth token.
 * Returns null on any failure (expired, malformed, wrong secret, etc).
 */
export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === "object" && decoded !== null && "userId" in decoded) {
      return { userId: Number((decoded as { userId: unknown }).userId) };
    }
    return null;
  } catch {
    return null;
  }
}
