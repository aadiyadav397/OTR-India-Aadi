import { Router } from "express";
import { pingDatabase } from "../db/client";

export const healthRouter = Router();

/**
 * GET /api/health
 * Basic liveness + DB connectivity check for the prototype.
 * Not an authenticated or production-grade endpoint.
 */
healthRouter.get("/health", (_req, res) => {
  const dbConnected = pingDatabase();

  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? "ok" : "degraded",
    service: "otr-india-backend",
    db: dbConnected ? "connected" : "unreachable",
    timestamp: new Date().toISOString(),
  });
});
