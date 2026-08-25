import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and fill in your Supabase/Neon connection string.",
  );
}

// Kept small deliberately: in a serverless environment, every function
// invocation can spin up its own Pool, and the default max (10) multiplied
// across concurrent invocations easily exhausts Supabase's free-tier pooler
// connection limit (observed in production: "tenant/user ... not found",
// Supavisor's error for a connection it can't route/admit). A single
// request needs at most a couple of concurrent queries (e.g. computeDelta's
// two parallel gap-score lookups), so this stays well within that.
const pool = new Pool({ connectionString, max: 3, idleTimeoutMillis: 10_000 });

export const db = drizzle(pool, { schema });
