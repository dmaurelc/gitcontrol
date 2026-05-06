import "server-only";
import Redis from "ioredis";
import { getEnv } from "@/lib/env";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export function getRedis(): Redis {
  if (globalForRedis.redis) return globalForRedis.redis;
  const env = getEnv();
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
