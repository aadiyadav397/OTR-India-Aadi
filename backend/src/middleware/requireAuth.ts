import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../auth/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

/**
 * Requires a valid "Authorization: Bearer <token>" header.
 * On success, attaches req.userId and calls next().
 * On failure, responds 401 and does not call next().
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.header("authorization") ?? req.header("Authorization");

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  const payload = verifyAuthToken(token);

  if (!payload) {
    res.status(401).json({ error: "Invalid or expired session. Please log in again." });
    return;
  }

  req.userId = payload.userId;
  next();
}
