/**
 * Included Actions minutes per billing plan. GitHub does not expose the
 * allowance through the API, so we map it from `plan.name`.
 *
 * Source: GitHub Actions billing docs (private-repo, GitHub-hosted runners).
 * Public repositories are always free and are not billed, so they never count
 * against the allowance.
 */
const INCLUDED_MINUTES_BY_PLAN: Record<string, number> = {
  free: 2000,
  // Legacy personal plan, same allowance as Free.
  developer: 2000,
  pro: 3000,
  team: 3000,
  business: 3000,
  enterprise: 50000,
  "enterprise cloud": 50000,
};

/**
 * Returns the monthly included Actions minutes for a plan name, or `null` when
 * the plan is unknown (caller should show usage without a denominator).
 */
export function includedMinutesForPlan(
  plan: string | null | undefined,
): number | null {
  if (!plan) return null;
  const key = plan.trim().toLowerCase();
  return key in INCLUDED_MINUTES_BY_PLAN ? INCLUDED_MINUTES_BY_PLAN[key] : null;
}
