import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { getRedis } from "@/lib/redis/client";

export const dynamic = "force-dynamic";

/**
 * Public liveness probe. Returns booleans only — no driver error messages,
 * hostnames, or version strings, so the endpoint cannot leak internal
 * topology to anonymous callers (Dokploy/Traefik probe consumes only the
 * status code anyway).
 */
export async function GET() {
  const result = { db: false, redis: false };
  try {
    await db.execute(sql`SELECT 1`);
    result.db = true;
  } catch (e) {
    console.error("[health] db", (e as Error).message);
  }
  try {
    const pong = await getRedis().ping();
    result.redis = pong === "PONG";
  } catch (e) {
    console.error("[health] redis", (e as Error).message);
  }
  const healthy = result.db && result.redis;
  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", db: result.db, redis: result.redis },
    { status: healthy ? 200 : 503 },
  );
}
