export type FreshnessState = "live" | "cached" | "stale";

export type Freshness = {
  state: FreshnessState;
  /** Seconds since fetchedAt. Always >= 0. */
  ageSeconds: number;
  /** Seconds remaining until the entry crosses into stale. <= 0 when stale. */
  remainingSeconds: number;
};

/**
 * Pure derivation from a cached entry's `fetchedAt` (epoch seconds) and the
 * TTL it was stored with. Bands:
 *   - live:   age < ttl/2
 *   - cached: ttl/2 <= age <= ttl
 *   - stale:  age > ttl
 */
export function computeFreshness(
  fetchedAt: number,
  ttlSeconds: number,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Freshness {
  const ageSeconds = Math.max(0, nowSeconds - fetchedAt);
  const remainingSeconds = ttlSeconds - ageSeconds;
  let state: FreshnessState;
  if (ageSeconds < ttlSeconds / 2) state = "live";
  else if (ageSeconds <= ttlSeconds) state = "cached";
  else state = "stale";
  return { state, ageSeconds, remainingSeconds };
}

/** Compact relative label, e.g. "3s ago", "2m ago", "1h ago". */
export function formatAge(ageSeconds: number): string {
  if (ageSeconds < 60) return `${Math.max(1, Math.floor(ageSeconds))}s ago`;
  if (ageSeconds < 3600) return `${Math.floor(ageSeconds / 60)}m ago`;
  if (ageSeconds < 86400) return `${Math.floor(ageSeconds / 3600)}h ago`;
  return `${Math.floor(ageSeconds / 86400)}d ago`;
}
