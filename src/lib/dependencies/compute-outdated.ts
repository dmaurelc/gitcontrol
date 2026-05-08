import semver from "semver";

export type OutdatedSeverity = "major" | "minor" | "patch" | "prerelease";

export type OutdatedResult =
  | { isOutdated: false; current: string | null; latest: string | null }
  | {
      isOutdated: true;
      current: string;
      latest: string;
      severity: OutdatedSeverity;
    };

/**
 * Pulls the lowest concrete version implied by a `requirements` string of
 * the form "^1.2.3", ">= 0.5.0", "= 1.4.3", "1.2.x", etc. Returns null
 * when no version can be coerced (git refs, file paths, etc.).
 */
function extractCurrent(requirements: string): string | null {
  if (!requirements) return null;
  const trimmed = requirements.replace(/^[\s=^~<>]+/, "").split(/\s+/)[0];
  if (!trimmed) return null;
  const coerced = semver.coerce(trimmed);
  return coerced?.version ?? null;
}

export function computeOutdated(
  requirements: string,
  latest: string | null,
): OutdatedResult {
  const current = extractCurrent(requirements);
  if (!current || !latest) {
    return { isOutdated: false, current, latest };
  }
  if (!semver.lt(current, latest)) {
    return { isOutdated: false, current, latest };
  }
  let severity: OutdatedSeverity;
  const diff = semver.diff(current, latest);
  if (diff === "major") severity = "major";
  else if (diff === "minor") severity = "minor";
  else if (
    diff === "patch" ||
    diff === "prepatch" ||
    diff === "preminor" ||
    diff === "premajor"
  ) {
    severity = diff === "patch" ? "patch" : "prerelease";
  } else severity = "prerelease";
  return { isOutdated: true, current, latest, severity };
}
