import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { healthRouter } from "./routes/health";

const app = express();

app.use(cors({ origin: env.FRONTEND_ORIGIN }));
app.use(express.json());

app.use("/api", healthRouter);

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[otr-india-backend] listening on http://localhost:${env.PORT}`);
  console.log(`[otr-india-backend] SQLite DB path: ${env.DATABASE_URL}`);
});
