export type HealthInput = {
  /** ISO date string of the most recent push to the default branch. */
  pushedAt: string | null;
  /** Open pull request `created_at` ISO timestamps. */
  openPrCreatedAt: string[];
  /** Open issue `updated_at` ISO timestamps. */
  openIssueUpdatedAt: string[];
  /** Most recent workflow run conclusion on the default branch. null = no runs. */
  lastRunConclusion:
    | "success"
    | "failure"
    | "cancelled"
    | "skipped"
    | "neutral"
    | "timed_out"
    | "action_required"
    | "stale"
    | null;
  /** When true, score is computed but the caller may decide to hide the badge. */
  archived?: boolean;
};

/**
 * Lightweight health score derived from `pushed_at` only — what every
 * listRepos response already has, so we can render the badge on the
 * /repositories grid without paying N×3 GitHub calls per page. Returns
 * the same shape as `computeHealthScore` so the badge component is
 * unchanged.
 */
export function computeQuickHealth(
  pushedAt: string | null,
  nowMs: number = Date.now(),
): HealthScore {
  const recency = clamp(commitRecencyScore(pushedAt, nowMs));
  return {
    total: recency,
    breakdown: {
      commitRecency: recency,
      prAge: 100,
      issueStaleness: 100,
      actionsStatus: 70,
    },
    band: recency >= 80 ? "good" : recency >= 60 ? "warn" : "bad",
  };
}

export type HealthBreakdown = {
  commitRecency: number;
  prAge: number;
  issueStaleness: number;
  actionsStatus: number;
};

export type HealthScore = {
  total: number; // 0-100
  breakdown: HealthBreakdown;
  band: "good" | "warn" | "bad";
};

const WEIGHTS = {
  commitRecency: 0.4,
  prAge: 0.2,
  issueStaleness: 0.2,
  actionsStatus: 0.2,
} as const;

const DAY_MS = 86_400_000;

function daysSince(iso: string | null, nowMs: number): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, (nowMs - t) / DAY_MS);
}

function commitRecencyScore(pushedAt: string | null, nowMs: number): number {
  const days = daysSince(pushedAt, nowMs);
  if (days === null) return 30; // unknown — mid-low.
  if (days <= 7) return 100;
  if (days <= 30) return 70;
  if (days <= 90) return 40;
  if (days <= 180) return 20;
  return 10;
}

function prAgeScore(openPrCreatedAt: string[], nowMs: number): number {
  if (openPrCreatedAt.length === 0) return 100;
  const ages = openPrCreatedAt
    .map((iso) => daysSince(iso, nowMs))
    .filter((d): d is number => d !== null)
    .sort((a, b) => a - b);
  if (ages.length === 0) return 100;
  const median = ages[Math.floor(ages.length / 2)];
  if (median <= 7) return 100;
  if (median <= 30) return 70;
  if (median <= 60) return 50;
  if (median <= 120) return 30;
  return 15;
}

function issueStalenessScore(
  openIssueUpdatedAt: string[],
  nowMs: number,
): number {
  if (openIssueUpdatedAt.length === 0) return 100;
  const stale = openIssueUpdatedAt.filter((iso) => {
    const days = daysSince(iso, nowMs);
    return days !== null && days > 90;
  }).length;
  const ratio = stale / openIssueUpdatedAt.length;
  if (ratio < 0.1) return 100;
  if (ratio < 0.3) return 60;
  if (ratio < 0.5) return 40;
  return 20;
}

function actionsStatusScore(
  conclusion: HealthInput["lastRunConclusion"],
): number {
  if (conclusion === null) return 70; // no runs — neutral.
  switch (conclusion) {
    case "success":
      return 100;
    case "neutral":
    case "skipped":
    case "cancelled":
      return 60;
    case "failure":
    case "timed_out":
    case "action_required":
    case "stale":
      return 0;
    default:
      return 50;
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function computeHealthScore(
  input: HealthInput,
  nowMs: number = Date.now(),
): HealthScore {
  const breakdown: HealthBreakdown = {
    commitRecency: clamp(commitRecencyScore(input.pushedAt, nowMs)),
    prAge: clamp(prAgeScore(input.openPrCreatedAt, nowMs)),
    issueStaleness: clamp(issueStalenessScore(input.openIssueUpdatedAt, nowMs)),
    actionsStatus: clamp(actionsStatusScore(input.lastRunConclusion)),
  };
  const total = clamp(
    breakdown.commitRecency * WEIGHTS.commitRecency +
      breakdown.prAge * WEIGHTS.prAge +
      breakdown.issueStaleness * WEIGHTS.issueStaleness +
      breakdown.actionsStatus * WEIGHTS.actionsStatus,
  );
  const band: HealthScore["band"] =
    total >= 80 ? "good" : total >= 60 ? "warn" : "bad";
  return { total, breakdown, band };
}
