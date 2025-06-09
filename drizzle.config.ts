import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "hinako",
    password: process.env.DB_PASSWORD || "hiphop_map",
    database: process.env.DB_NAME || "hiphop_map",
    ssl: false,
  },
} satisfies Config;
