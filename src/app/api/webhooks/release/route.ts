import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { invalidateGlobal } from "@/lib/github/cache";
import { getRedis } from "@/lib/redis/client";

export const dynamic = "force-dynamic";

/**
 * Invalidates the changelog/release caches when a new GitHub Release is
 * published. Triggered by the release.yml workflow with a shared secret.
 * Wipes both the `releases` cachedFetch entries and the
 * `release:commitdate:*` Redis keys, then revalidates the /changelog path.
 */
export async function POST(request: Request) {
  const secret = process.env.RELEASE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Webhook not configured" },
      { status: 503 },
    );
  }

  const provided = request.headers.get("x-webhook-secret") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  let releasesDeleted = 0;
  let commitDatesDeleted = 0;

  try {
    releasesDeleted = await invalidateGlobal("releases");
  } catch (e) {
    console.error("[webhook/release] invalidate releases", (e as Error).message);
  }

  try {
    const redis = getRedis();
    const stream = redis.scanStream({ match: "release:commitdate:*", count: 100 });
    const pipeline = redis.pipeline();
    for await (const keys of stream as AsyncIterable<string[]>) {
      for (const k of keys) {
        pipeline.del(k);
        commitDatesDeleted++;
      }
    }
    if (commitDatesDeleted > 0) await pipeline.exec();
  } catch (e) {
    console.error("[webhook/release] invalidate commitdates", (e as Error).message);
  }

  revalidatePath("/changelog");

  return NextResponse.json({
    ok: true,
    releasesDeleted,
    commitDatesDeleted,
  });
}
