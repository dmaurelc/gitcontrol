/**
 * Pure helpers for GitHub OAuth scope strings. Kept free of `server-only` so
 * they can be unit-tested directly.
 */

/**
 * Splits a raw GitHub OAuth scope string into a normalized list. GitHub
 * returns scopes comma-separated; some providers/proxies use spaces, so both
 * separators are accepted and empties are dropped.
 */
export function parseScopes(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** True when a raw scope string grants `scope`. */
export function scopesInclude(
  raw: string | null | undefined,
  scope: string,
): boolean {
  return parseScopes(raw).includes(scope);
}
