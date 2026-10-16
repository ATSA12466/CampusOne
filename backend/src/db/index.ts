import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/campusone";

export const pool = new Pool({
  connectionString,
  max: 10,
});

export const db = drizzle(pool, { schema });
