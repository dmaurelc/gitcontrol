import "server-only";
import { createHash } from "node:crypto";
import { getRedis } from "@/lib/redis/client";

export const TTL = {
  viewer: 3600,
  repos: 300,
  repo: 300,
  issues: 120,
  prs: 120,
  stars: 600,
  orgs: 1800,
  packages: 600,
  projects: 300,
  readme: 1800,
  languages: 3600,
  tags: 600,
  releases: 60,
  contributors: 600,
  commits: 60,
  branches: 300,
  contents: 300,
  commitActivity: 3600,
  codeFrequency: 3600,
  traffic: 600,
  repoHealth: 600,
  dependencyManifests: 1800,
  npmLatest: 3600,
  contributionsHeatmap: 3600,
  commitDetail: 86400,
  checks: 60,
  pullsForCommit: 120,
  branchTree: 300,
} as const;

export type CacheKind = keyof typeof TTL;

function hashParams(params: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(params ?? {}))
    .digest("hex")
    .slice(0, 16);
}

export function buildKey(
  userId: string,
  resource: string,
  params?: unknown,
): string {
  return `gh:${userId}:${resource}:${hashParams(params)}`;
}

type CachedEnvelope<T> = {
  body: T;
  etag?: string;
  fetchedAt: number;
};

export type FetchResult<T> = {
  data: T;
  etag?: string;
  fromCache: boolean;
  /** Epoch seconds. When the cached body was last fetched from GitHub. */
  fetchedAt: number;
  /** Same as the TTL the entry was written with. */
  ttlSeconds: number;
};

/**
 * Wraps a GitHub fetcher with Redis cache + ETag revalidation. The fetcher
 * receives the previously stored ETag (if any) and MUST return the new body
 * plus the response's ETag. If the GitHub call returned 304, the fetcher
 * should return { notModified: true }.
 */
export async function cachedFetch<T>(opts: {
  userId: string;
  resource: string;
  params?: unknown;
  ttlSeconds: number;
  fetcher: (etag: string | undefined) => Promise<
    | { notModified: true }
    | { notModified: false; body: T; etag?: string }
  >;
}): Promise<FetchResult<T>> {
  const redis = getRedis();
  const key = buildKey(opts.userId, opts.resource, opts.params);
  const cachedRaw = await redis.get(key);
  const cached = cachedRaw
    ? (JSON.parse(cachedRaw) as CachedEnvelope<T>)
    : null;

  const result = await opts.fetcher(cached?.etag);

  if (result.notModified && cached) {
    // Refresh TTL on hit-via-304.
    await redis.expire(key, opts.ttlSeconds);
    return {
      data: cached.body,
      etag: cached.etag,
      fromCache: true,
      fetchedAt: cached.fetchedAt,
      ttlSeconds: opts.ttlSeconds,
    };
  }

  if (result.notModified) {
    // No previous cache but server said not modified — defensive fallback.
    throw new Error("cachedFetch received notModified without prior cache");
  }

  const fetchedAt = Math.floor(Date.now() / 1000);
  const envelope: CachedEnvelope<T> = {
    body: result.body,
    etag: result.etag,
    fetchedAt,
  };
  await redis.set(key, JSON.stringify(envelope), "EX", opts.ttlSeconds);
  return {
    data: result.body,
    etag: result.etag,
    fromCache: false,
    fetchedAt,
    ttlSeconds: opts.ttlSeconds,
  };
}

/**
 * Invalidate every cache entry for a user matching a resource prefix, e.g.
 * `gh:{userId}:repos:*`. Pass `"*"` to wipe all resources for the user.
 */
export async function invalidate(userId: string, resource: string) {
  const redis = getRedis();
  const pattern =
    resource === "*" ? `gh:${userId}:*` : `gh:${userId}:${resource}:*`;
  const stream = redis.scanStream({ match: pattern, count: 100 });
  const pipeline = redis.pipeline();
  let deleted = 0;
  for await (const keys of stream as AsyncIterable<string[]>) {
    for (const k of keys) {
      pipeline.del(k);
      deleted++;
    }
  }
  if (deleted > 0) await pipeline.exec();
  return deleted;
}

/**
 * Cross-user invalidation for a single resource type. Useful when an
 * upstream artifact changes globally (e.g. a new GitHub Release) and every
 * cached copy across users should be wiped.
 */
export async function invalidateGlobal(resource: string) {
  const redis = getRedis();
  const pattern = `gh:*:${resource}:*`;
  const stream = redis.scanStream({ match: pattern, count: 100 });
  const pipeline = redis.pipeline();
  let deleted = 0;
  for await (const keys of stream as AsyncIterable<string[]>) {
    for (const k of keys) {
      pipeline.del(k);
      deleted++;
    }
  }
  if (deleted > 0) await pipeline.exec();
  return deleted;
}
