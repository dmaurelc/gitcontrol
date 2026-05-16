import "server-only";
import { getEnv } from "@/lib/env";
import * as schema from "./schema";

type Schema = typeof schema;

// Drizzle's NodePg and Neon database types share the same query-builder
// surface (select/insert/update/delete/transaction). We expose the
// node-postgres variant as the public type because most call sites already
// reference it; the neon variant is structurally compatible at runtime.
type DrizzleDb = import("drizzle-orm/node-postgres").NodePgDatabase<Schema>;

const globalForDb = globalThis as unknown as {
  drizzleDb?: DrizzleDb;
};

function createDb(): DrizzleDb {
  const env = getEnv();
  if (env.DB_DRIVER === "neon") {
    // Neon serverless driver: websocket-based pool, drop-in compatible with
    // pg.Pool API. Designed for serverless environments where TCP pools
    // don't persist between invocations.
    const { Pool } = require("@neondatabase/serverless") as typeof import("@neondatabase/serverless");
    const { drizzle } = require("drizzle-orm/neon-serverless") as typeof import("drizzle-orm/neon-serverless");
    const pool = new Pool({ connectionString: env.DATABASE_URL });
    return drizzle(pool, { schema }) as unknown as DrizzleDb;
  }
  // Default: node-postgres for Docker/Dokploy and local dev.
  const { Pool } = require("pg") as typeof import("pg");
  const { drizzle } = require("drizzle-orm/node-postgres") as typeof import("drizzle-orm/node-postgres");
  const pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });
  return drizzle(pool, { schema });
}

function getDb(): DrizzleDb {
  if (globalForDb.drizzleDb) return globalForDb.drizzleDb;
  const instance = createDb();
  if (getEnv().NODE_ENV !== "production") globalForDb.drizzleDb = instance;
  return instance;
}

// Proxy so `db.select(...)` lazily initializes on first call. Avoids running
// env validation during Next's build-time page-data collection.
export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop, receiver) {
    const inner = getDb() as unknown as Record<PropertyKey, unknown>;
    const value = inner[prop as string];
    if (typeof value === "function")
      return (value as (...args: unknown[]) => unknown).bind(inner);
    return Reflect.get(inner as object, prop, receiver);
  },
}) as DrizzleDb;

export type DB = typeof db;
