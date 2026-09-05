import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { profileRouter } from "./routes/profile";

const app = express();

app.use(cors({ origin: env.FRONTEND_ORIGIN }));
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[otr-india-backend] listening on http://localhost:${env.PORT}`);
  console.log(`[otr-india-backend] SQLite DB path: ${env.DATABASE_URL}`);
});
