/**
 * Pure parsing/aggregation helpers for the GitHub "enhanced billing platform"
 * usage report. Kept free of `server-only` and network access so they can be
 * unit-tested directly.
 *
 * Response shape (subset we consume):
 *   { usageItems: [{ date, product, sku, quantity, unitType,
 *                    pricePerUnit, grossAmount, discountAmount, netAmount,
 *                    organizationName, repositoryName }] }
 */

export type BillingUsageItem = {
  date?: string;
  product?: string;
  sku?: string;
  quantity?: number;
  unitType?: string;
  pricePerUnit?: number;
  grossAmount?: number;
  discountAmount?: number;
  netAmount?: number;
  organizationName?: string | null;
  repositoryName?: string | null;
};

export type BillingUsageResponse = {
  usageItems?: BillingUsageItem[];
};

export type ActionsUsageStatus =
  | "ok"
  | "missing_scope"
  | "forbidden_org"
  | "unavailable";

export type ActionsOsBucket = {
  os: string;
  sku: string;
  minutes: number;
  netAmount: number;
};

export type ActionsRepoBucket = {
  repo: string;
  minutes: number;
  netAmount: number;
};

export type ActionsDayBucket = {
  date: string;
  minutes: number;
};

export type AggregatedActionsUsage = {
  usedMinutes: number;
  netAmount: number;
  byOs: ActionsOsBucket[];
  byRepo: ActionsRepoBucket[];
  byDay: ActionsDayBucket[];
};

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * True when the item is a billable Actions *minutes* line.
 *
 * Tolerance note: GitHub's enhanced billing platform is expected to return
 * `product: "Actions"` + `unitType: "Minutes"`, but the exact casing/labels are
 * unverified against a live token. We accept any product containing "action"
 * and any unit containing "minute"; a missing unit is treated as minutes
 * (defensive — the API normally always sends it).
 */
export function isActionsMinuteItem(item: BillingUsageItem): boolean {
  const product = (item.product ?? "").toLowerCase();
  if (!product.includes("action")) return false;
  const unit = (item.unitType ?? "").toLowerCase();
  return unit === "" || unit.includes("minute");
}

/** Maps an Actions SKU (e.g. "Actions Windows") to a friendly OS label. */
export function osFromSku(sku: string | undefined): string {
  const s = (sku ?? "").toLowerCase();
  if (s.includes("macos")) return "macOS";
  if (s.includes("windows")) return "Windows";
  if (s.includes("linux")) return "Linux";
  if (s.includes("storage")) return "Storage";
  return sku?.trim() || "Other";
}

export function aggregateActionsUsage(
  items: BillingUsageItem[],
): AggregatedActionsUsage {
  let usedMinutes = 0;
  let netAmount = 0;
  const osMap = new Map<string, ActionsOsBucket>();
  const repoMap = new Map<string, ActionsRepoBucket>();
  const dayMap = new Map<string, ActionsDayBucket>();

  for (const item of items) {
    if (!isActionsMinuteItem(item)) continue;
    const minutes = Number(item.quantity) || 0;
    const cost = Number(item.netAmount) || 0;
    usedMinutes += minutes;
    netAmount += cost;

    const os = osFromSku(item.sku);
    const osBucket = osMap.get(os) ?? {
      os,
      sku: item.sku ?? os,
      minutes: 0,
      netAmount: 0,
    };
    osBucket.minutes += minutes;
    osBucket.netAmount += cost;
    osMap.set(os, osBucket);

    const repo = (item.repositoryName ?? "").trim() || "Unknown repository";
    const repoBucket = repoMap.get(repo) ?? { repo, minutes: 0, netAmount: 0 };
    repoBucket.minutes += minutes;
    repoBucket.netAmount += cost;
    repoMap.set(repo, repoBucket);

    if (item.date) {
      const dayBucket = dayMap.get(item.date) ?? { date: item.date, minutes: 0 };
      dayBucket.minutes += minutes;
      dayMap.set(item.date, dayBucket);
    }
  }

  const byOs = [...osMap.values()]
    .map((b) => ({ ...b, minutes: round2(b.minutes), netAmount: round2(b.netAmount) }))
    .sort((a, b) => b.minutes - a.minutes);
  const byRepo = [...repoMap.values()]
    .map((b) => ({ ...b, minutes: round2(b.minutes), netAmount: round2(b.netAmount) }))
    .sort((a, b) => b.minutes - a.minutes);
  const byDay = [...dayMap.values()]
    .map((b) => ({ ...b, minutes: round2(b.minutes) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { usedMinutes: round2(usedMinutes), netAmount: round2(netAmount), byOs, byRepo, byDay };
}

/**
 * Maps a fetch failure to a non-throwing status for the UI.
 * A 403 on the personal endpoint almost always means the token is missing the
 * `user` scope; on the org endpoint it means the caller is not an org owner /
 * billing manager.
 */
export function classifyBillingError(
  err: unknown,
  kind: "user" | "org",
): ActionsUsageStatus {
  const status = (err as { status?: number })?.status;
  if (status === 401) return "missing_scope";
  if (status === 403) return kind === "org" ? "forbidden_org" : "missing_scope";
  // GitHub answers 404 (not 403) to the personal billing endpoint when the
  // token lacks the `user` scope, even if the stored scope says otherwise.
  if (status === 404 && kind === "user") return "missing_scope";
  return "unavailable";
}
