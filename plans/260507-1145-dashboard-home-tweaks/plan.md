# Dashboard Home Tweaks

> Status: completed · Created: 2026-05-07 · Branch: develop

UX adjustments to `/(dashboard)/dashboard/page.tsx` — make KPIs navigable, fix recent-repos sort, add aggregated PR/issue/activity views, and improve notifications dropdown.

## Phases

| Phase | Title | Status |
|-------|-------|--------|
| 01 | KPI cards link + new aggregated PR/Issue views | done |
| 02 | Move contributions chart below KPIs | done |
| 03 | Fix "Recently updated" sort + cap to 6 | done |
| 04 | Activity card cap to 6 + per-event links + "View all" page | done |
| 05 | Notifications: header link + "Mark all as read" + open in new tab option | done |

## Key Files

- `src/app/(dashboard)/dashboard/page.tsx` — reorder + caps + KPI linking
- `src/components/stat-card.tsx` — accept optional `href` prop
- `src/components/activity-feed.tsx` — derive event URLs, accept `limit` + `footer`
- `src/components/notifications-bell.tsx` — add "Mark all read" + footer link
- `src/lib/github/service.ts` — add `searchIssuesAcrossRepos` + `markAllNotificationsRead`
- `src/app/actions/notifications.ts` — add `markAllNotificationsReadAction`
- New routes:
  - `src/app/(dashboard)/pulls/page.tsx`
  - `src/app/(dashboard)/issues/page.tsx`
  - `src/app/(dashboard)/activity/page.tsx`
  - `src/app/(dashboard)/notifications/page.tsx`

## Dependencies

Octokit `rest.search.issuesAndPullRequests` (already part of @octokit/rest) for cross-repo aggregation. No new deps.

## Risks

- GitHub Search API rate limit (30 req/min unauth, 30/min auth) — mitigate with 60–120s Redis cache.
- Recent-repos order differs from github.com because we sort by `pushed_at` not `updated_at`. Aligning may require switching `sort` param from `updated` to GitHub's actual "last updated" semantic; verify field used.
- Notification subject URLs sometimes lack issue/PR pattern (Discussion, Release) → fallback already exists, keep.
