# GitHub Actions Usage Dashboard

**Date**: 2026-09-28
**Severity**: Medium (new feature)
**Component**: GitHub API layer, auth scopes, dashboard, new `/actions` page
**Status**: Resolved (pending live-token verification)

## What Happened

Implemented the `260927-1520-github-actions-usage-dashboard` plan end-to-end: an Actions usage widget on `/dashboard` and a full `/actions` page showing billable minutes vs. included quota, per-OS/per-repo/day breakdown, success rate, slow/failing workflows and recent failed runs. Works for personal accounts and orgs via the active-context cookie.

## The Brutal Truth

The plan was unusually good, and two of its own "open questions" were the whole game. The first: the enhanced billing usage endpoint returns `date`, `sku` and `repositoryName` on every `usageItem`, which means the daily trend, per-OS and per-repo breakdowns all fall out of **one** request — so phase 5's proposed `actions_usage_daily` table, migration and Redis lock were pure ceremony. We took the plan's own YAGNI escape hatch and deleted the phase's surface area without losing a single feature.

The second: re-authorization. The intuitive fix (`signIn.social`) is wrong — Better Auth documents that sign-in re-authentication does **not** modify `account.scope`. Only `linkSocial` merges incremental grants. That one line of docs saved a subtle "why is my scope still empty" bug.

## Technical Details

**Data sources** (deliberately separate):
- Billing (private repos only): `GET /users/{u}/settings/billing/usage` · `GET /organizations/{org}/settings/billing/usage`. Enhanced billing platform; `product`/`unitType` casing unverified against a live token, so matching is tolerant (product contains "action", unit contains "minute").
- Activity (public + private): `rest.actions.listWorkflowRunsForRepo` via `githubService.listWorkflowRuns`.

**Key decisions**:
- Trend derived from `usage.byDay` in the same billing call → no DB table, no migration, no cron.
- Own `mapLimit` helper instead of adding `p-limit` → zero new runtime deps.
- Tests via Node's built-in runner (`node --test`, Node 22 native TS stripping) → zero new dev deps either. `tsconfig` gained `allowImportingTsExtensions`.
- `getActionsUsage` never throws: returns `ok | missing_scope | forbidden_org | unavailable`.

**Post-review fixes** (adversarial review caught two real HIGH bugs):
1. Activity month filter had **no upper bound** — past-month views would have shown current-month runs. Fixed by requesting a date range (`created=YYYY-MM-DD..YYYY-MM-DD`) and filtering `startIso <= created_at < endIso`.
2. `created` was sent with millisecond precision (`...T00:00:00.000Z`), which GitHub can 422 → silently emptied every repo. Now date-only for the request, ISO compare in code.
3. Deduped the billing fetch (was firing twice per `/actions` render), capped activity fan-out to `MAX_REPOS` including billing extras, bounded the month selector to 12 months, tolerant `isActionsMinuteItem`, stable React keys + empty-href guard.

**Verification**: `tsc --noEmit` clean · `pnpm build` OK (`ƒ /actions` present) · 21/21 unit tests · all new files ESLint-clean. `pnpm lint` still fails on **pre-existing** `no-require-imports` errors in `src/lib/db/client.ts` (untouched).

## Open Items

- Verify against a real token: exact `usageItems` shape, minutes vs. the GitHub Billing page, and the `linkSocial` re-consent flow in preview (user with/without scope, org admin/non-admin).
- Numbers are raw runner-minutes; allowance consumes at 1×/2×/10× (Linux/Windows/macOS). UI labels this; exact billable-equivalent would require weighting.
- Org billing needs owner/billing-manager rights; `read:org` may be insufficient (degrades to `forbidden_org` by design).
