import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getEnv } from "@/lib/env";
import * as schema from "./schema";

type Schema = typeof schema;

const globalForDb = globalThis as unknown as {
  pgPool?: Pool;
  drizzleDb?: NodePgDatabase<Schema>;
};

function getDb(): NodePgDatabase<Schema> {
  if (globalForDb.drizzleDb) return globalForDb.drizzleDb;
  const env = getEnv();
  const pool =
    globalForDb.pgPool ??
    new Pool({ connectionString: env.DATABASE_URL, max: 10 });
  globalForDb.pgPool = pool;
  const instance = drizzle(pool, { schema });
  if (env.NODE_ENV !== "production") globalForDb.drizzleDb = instance;
  return instance;
}

// Proxy so `db.select(...)` lazily initializes on first call. Avoids running
// env validation during Next's build-time page-data collection.
export const db = new Proxy({} as NodePgDatabase<Schema>, {
  get(_target, prop, receiver) {
    const inner = getDb() as unknown as Record<PropertyKey, unknown>;
    const value = inner[prop as string];
    if (typeof value === "function") return (value as Function).bind(inner);
    return Reflect.get(inner as object, prop, receiver);
  },
}) as NodePgDatabase<Schema>;

export type DB = typeof db;
