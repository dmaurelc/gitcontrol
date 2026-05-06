import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { getRedis } from "@/lib/redis/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = { db: "unknown", redis: "unknown" };
  try {
    await db.execute(sql`SELECT 1`);
    result.db = "ok";
  } catch (e) {
    result.db = `error: ${(e as Error).message}`;
  }
  try {
    const r = getRedis();
    const pong = await r.ping();
    result.redis = pong === "PONG" ? "ok" : `unexpected: ${pong}`;
  } catch (e) {
    result.redis = `error: ${(e as Error).message}`;
  }
  const healthy = result.db === "ok" && result.redis === "ok";
  return NextResponse.json(result, { status: healthy ? 200 : 503 });
}
