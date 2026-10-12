import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Offline generation does not need a database. Connected commands must receive
// DATABASE_URL from the environment; no checked-in credential/local DB fallback.
const url = process.env.DATABASE_URL?.trim();
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  ...(url ? { dbCredentials: { url } } : {}),
  strict: true,
});
