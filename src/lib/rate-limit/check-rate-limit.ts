import "server-only";
import { getRedis } from "@/lib/redis/client";

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSeconds: number };

/**
 * Sliding-window-ish rate limiter backed by Redis. Uses INCR + EXPIRE on
 * first hit so the counter auto-resets after `windowSeconds`. Suitable for
 * per-user throttling on server actions — not exact, but good enough to
 * blunt accidental hammering and brute force.
 *
 * Disabled outside production so dev/test runs are not throttled.
 */
export async function checkRateLimit(opts: {
  bucket: string;
  identifier: string;
  max: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  if (process.env.NODE_ENV !== "production") {
    return { ok: true, remaining: opts.max };
  }

  const key = `rl:${opts.bucket}:${opts.identifier}`;
  const r = getRedis();
  const count = await r.incr(key);
  if (count === 1) {
    await r.expire(key, opts.windowSeconds);
  }
  if (count > opts.max) {
    const ttl = await r.ttl(key);
    return { ok: false, retryAfterSeconds: ttl > 0 ? ttl : opts.windowSeconds };
  }
  return { ok: true, remaining: Math.max(0, opts.max - count) };
}

/**
 * Throws a tagged error when the bucket is exhausted. Server actions that
 * use `runAction` will catch it and surface a "rate_limited" code to the
 * client; callers using direct throw (createOutdatedIssueAction et al.)
 * will bubble the error to the form.
 */
export async function enforceRateLimit(opts: {
  bucket: string;
  identifier: string;
  max: number;
  windowSeconds: number;
}): Promise<void> {
  const res = await checkRateLimit(opts);
  if (res.ok) return;
  const err = new Error(
    `Demasiadas peticiones. Intenta de nuevo en ${res.retryAfterSeconds}s.`,
  );
  (err as Error & { code?: string; retryAfterSeconds?: number }).code =
    "rate_limited";
  (err as Error & { retryAfterSeconds?: number }).retryAfterSeconds =
    res.retryAfterSeconds;
  throw err;
}
