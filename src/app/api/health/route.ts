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
  let dbOk = false;
  // Redis status is "disabled" when CACHE_ENABLED=false, "ok" on PONG,
  // false on error. Treated as healthy unless explicitly broken.
  let redisStatus: "ok" | "disabled" | false = false;

  try {
    await db.execute(sql`SELECT 1`);
    dbOk = true;
  } catch (e) {
    console.error("[health] db", (e as Error).message);
  }

  const redis = getRedis();
  if (redis === null) {
    redisStatus = "disabled";
  } else {
    try {
      const pong = await redis.ping();
      if (pong === "PONG") redisStatus = "ok";
    } catch (e) {
      console.error("[health] redis", (e as Error).message);
    }
  }

  const healthy = dbOk && redisStatus !== false;
  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", db: dbOk, redis: redisStatus },
    { status: healthy ? 200 : 503 },
  );
}
