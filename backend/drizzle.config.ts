import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "../database/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "../database/otr.db",
  },
} satisfies Config;
