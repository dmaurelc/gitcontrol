import "server-only";
import { cachedFetch, TTL } from "@/lib/github/cache";

type NpmPackage = {
  version: string;
  deprecated?: string;
};

/**
 * Fetches the latest published version of a npm package via the public
 * registry. Cached at `TTL.npmLatest`. Returns null on 404 / network
 * failure so callers can render an "unknown" state instead of crashing.
 *
 * Cache key is namespaced under the user so we share a quota across
 * users without leaking results, but the registry itself is anonymous
 * — there's no per-user response to leak. Keeping the userId in the
 * key is a safe default that mirrors the rest of the cache layer.
 */
export async function getNpmLatest(
  userId: string,
  packageName: string,
): Promise<{ version: string; deprecated: boolean } | null> {
  const result = await cachedFetch<{
    version: string;
    deprecated: boolean;
  } | null>({
    userId,
    resource: "npmLatest",
    params: { packageName },
    ttlSeconds: TTL.npmLatest,
    fetcher: async () => {
      try {
        const url = `https://registry.npmjs.org/${encodeURIComponent(
          packageName,
        )}/latest`;
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return { notModified: false as const, body: null };
        const json = (await res.json()) as NpmPackage;
        return {
          notModified: false as const,
          body: {
            version: json.version,
            deprecated: typeof json.deprecated === "string",
          },
        };
      } catch {
        return { notModified: false as const, body: null };
      }
    },
  });
  return result.data;
}
