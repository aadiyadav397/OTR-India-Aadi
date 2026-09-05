import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { profileRouter } from "./routes/profile";
import { educationRouter } from "./routes/education";
import { credentialsRouter } from "./routes/credentials";
import { documentsRouter } from "./routes/documents";
import { portalsRouter } from "./routes/portals";
import { consentsRouter } from "./routes/consents";
import { applicationsRouter } from "./routes/applications";
import { seedPortalsAndMappings } from "./db/seed";

seedPortalsAndMappings();

const app = express();

app.use(cors({ origin: env.FRONTEND_ORIGIN }));
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/education", educationRouter);
app.use("/api/credentials", credentialsRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/portals", portalsRouter);
app.use("/api/consents", consentsRouter);
app.use("/api/applications", applicationsRouter);

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[otr-india-backend] listening on http://localhost:${env.PORT}`);
  console.log(`[otr-india-backend] SQLite DB path: ${env.DATABASE_URL}`);
});
