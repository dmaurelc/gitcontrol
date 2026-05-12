# Project Rename: MaurelDev → GitControl

**Date**: 2026-05-11 21:33
**Severity**: Medium
**Component**: Project identity, repository, branding
**Status**: Resolved

## What Happened

Executed 7-phase project rename from personal-brand "MaurelDev" to product-brand "GitControl". The pivot: shifting from personal dev portfolio into an adoptable open product that others can deploy. GitHub repo renamed `dmaurelc/maureldev` → `dmaurelc/gitcontrol`, code refactored, databases recreated, Dokploy redeployed successfully.

## The Brutal Truth

This was tedious but clean. The frustration wasn't technical—it was the sheer number of touch points: 10 code files, 5 docs, Docker configs, database names, OAuth integrations, GitHub workflows, Dokploy webhooks. What made it bearable: we discovered two actual bugs hiding under the surface, and fixing them felt like finding money in old jeans.

The hard part wasn't the rename itself. It was deciding what NOT to rename. We left production DB named `maureldev` with `user/db/password` intact because migrating it offered zero value—Dokploy connects via `DATABASE_URL` env var anyway. That decision saved ~2 hours of downtime risk for a cosmetic change. Did it feel wrong? Yes. Was it right? Absolutely.

## Technical Details

**Code refactor scope** (Phase 2):
- `package.json:2` → `"name": "gitcontrol"`
- 8 app files (layout, login, sidebar, changelog, report-bug, bug-report action, github client, upstream repo constant)
- User-Agent header: `GitControl/0.1 (+https://github.com/dmaurelc/gitcontrol)`
- 5 documentation files updated

**Database decision** (Phase 3):
- Local Postgres volumes destroyed + recreated with `gitcontrol_db` + `gitcontrol_user` — clean slate, no important data lost
- Production: Postgres still named `maureldev` user/db (intentional legacy)
- App connects via `DATABASE_URL` env var (connection string in Dokploy secrets), so naming is irrelevant at runtime

**Bugs discovered and fixed**:

1. **Issue #76/PR #77**: Logout broken post-rename. Root cause: `<form action={signOutAction}>` nested inside Radix `<DropdownMenuItem asChild>`. When user clicked logout, the dropdown closes (unmounts form children) BEFORE browser can submit the form, triggering "Form submission canceled because the form is not connected" error. Fix: new `SignOutMenuItem` client component using `useTransition + onSelect` callback (no form submission). Affected: `src/app/(dashboard)/_components/topbar.tsx` + `sidebar-user-card.tsx`. Settings page unaffected (form exists outside dropdown).

2. **v0.9.2**: Console flooded with 410 Gone errors when fetching deleted GitHub issues. Octokit logs non-2xx responses via `console.error`, which surfaced in Next dev overlay. Page handled rejection gracefully via `Promise.allSettled` but the noise was alarming. Fix: added 410 to SILENT_STATUS_CODES regex in `src/lib/github/client.ts` alongside 304/403/404/422.

**Deployment verification** (Phase 5):
- 4 successful Dokploy redeploys post-rename (commits 86f5806, 710520e, 5c203ba, b037495)
- Release workflow ran clean for v0.9.2
- Bug report form creates issues in `dmaurelc/gitcontrol` directly
- Login + logout working end-to-end

## What We Tried

- Investigated renaming production database: rejected (no value, high risk)
- Investigated renaming GitHub username: deferred (out of scope for rename sprint, user keeps `dmaurelc` as personal identity)
- Investigated renaming local project folder from `maureldev` → `gitcontrol`: deferred (would break absolute paths in plan configs, low value now)

## Root Cause Analysis

The logout bug wasn't caused by the rename itself—it was exposed by the rename. The form-in-dropdown pattern was always fragile; we only discovered it when testing the renamed version. The 410 errors were logging noise that had existed all along but became visible once we paid attention during verification.

The DB naming decision came down to risk-benefit. Postgres user/db names are internal—zero public surface. Renaming would require downtime and migration testing for purely cosmetic gain. We chose pragmatism over consistency.

## Lessons Learned

1. **Rename reveals fragile patterns**: Full renames force you to test every code path. Two bugs emerged that would've silently festered otherwise.

2. **Environment variables > hardcoded names**: Because we used `DATABASE_URL`, we avoided a production migration. Lesson: externalize everything that might change.

3. **Deferred cosmetic work doesn't kill projects**: Saying "no" to domain purchase, folder rename, and GitHub org creation let us ship on time. Those can happen post-launch without blocking anything.

4. **Form composition in headless UI needs care**: Radix's `asChild` prop is powerful but unforgiving. Forms must not be unmounted by parent menu close. Use callbacks or separate the concerns.

5. **Know your logging verbosity**: Octokit's console.error for non-2xx was useful for debugging but became noise at scale. SILENT_STATUS_CODES pattern works but make it discoverable.

## Next Steps

- **Closed**: Rename complete (main branch updated 5c203ba)
- **Monitor**: Prod stability over next 48h (watch Dokploy logs for any DB or webhook issues)
- **Future** (separate sprint):
  - Purchase gitcontrol.io / gitcontrol.dev domains
  - Update homepage/GitHub topics
  - Rename GitHub organization if we're adopting GitControl as org brand (not user brand)
  - Consider folder rename after all absolute paths are relative

**Owner**: danielmc | **Blocked by**: None | **Timeline**: Complete
