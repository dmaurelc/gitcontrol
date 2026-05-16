import "server-only";
import Redis from "ioredis";
import { getEnv } from "@/lib/env";

// Cache holds either a connected client or `null` when CACHE_ENABLED=false.
// Using `undefined` to distinguish "not yet initialized" from "intentionally
// disabled" so consumers don't repeatedly re-evaluate env.
const globalForRedis = globalThis as unknown as {
  redis?: Redis | null;
};

/**
 * Returns the Redis client, or `null` when caching is disabled (Vercel
 * staging mode). Callers MUST handle the null case with a pass-through to
 * the underlying data source.
 */
export function getRedis(): Redis | null {
  if (globalForRedis.redis !== undefined) return globalForRedis.redis;
  const env = getEnv();
  if (!env.CACHE_ENABLED || !env.REDIS_URL) {
    globalForRedis.redis = null;
    return null;
  }
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  });
  client.on("error", (err) => {
    console.error("[redis] error", err.message);
  });
  if (env.NODE_ENV !== "production") globalForRedis.redis = client;
  return client;
}
