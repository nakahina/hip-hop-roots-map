import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "hinako",
  password: process.env.DB_PASSWORD || "hiphop_map",
  database: process.env.DB_NAME || "hiphop_map",
});

export const db = drizzle(pool, { schema });
