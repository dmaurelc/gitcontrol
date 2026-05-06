import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getEnv } from "@/lib/env";
import * as schema from "./schema";

const env = getEnv();

const globalForPool = globalThis as unknown as { pgPool?: Pool };

const pool =
  globalForPool.pgPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
  });

if (env.NODE_ENV !== "production") globalForPool.pgPool = pool;

export const db = drizzle(pool, { schema });
export type DB = typeof db;
