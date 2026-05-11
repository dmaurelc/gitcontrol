---
title: "GitHub-style Contribution Graph (Heatmap)"
description: "12-month SVG contribution heatmap on the dashboard, sourced from GraphQL contributionsCollection (no separate persistence)."
status: completed
priority: P2
effort: 3h
branch: feature/contribution-graph
tags: [dashboard, github-api, heatmap]
created: 2026-05-10
completed: 2026-05-11
---

# Contribution Graph (Heatmap) — Plan

GitHub-style 12-month contribution heatmap on `/dashboard`. Sourced from the same `viewer.contributionsCollection.contributionCalendar` GraphQL query that already powers the 28-day chart — no separate ingestion pipeline, table, or webhook needed for v1.

Unblocks post-MVP phase 7e (was specced as a chart, replaced by this heatmap).

## Shipped (v1)

| # | Commit | Files | Description |
|---|--------|-------|-------------|
| 1 | `b195320` | `src/lib/github/cache.ts`, `src/lib/github/service.ts` | `getContributionsHeatmap(userId)` service method + Redis TTL 3600s |
| 2 | `7c87d2e` | `src/components/contribution-heatmap{,-grid,-buckets}.{ts,tsx}` | Custom SVG grid 7×52, 5-bucket Tailwind palette, hover tooltip, native `<title>` for a11y |
| 3 | `e9e57b4` | `src/app/(dashboard)/dashboard/page.tsx` | Mount heatmap above 28-day chart with own Suspense + skeleton |
| 4 | `6d1d7a0` | dashboard + heatmap card | Pair heatmap (60%) + 28-day chart (40%) at `xl:` breakpoint with `h-full` |

Branch `feature/contribution-graph` from `develop`. PR pending user approval.

## Scope Decisions (YAGNI)

Original plan specced 6 phases / 18h with Postgres `user_activity_daily` table, GraphQL backfill module, webhook handler (HMAC SHA-256), delivery dedupe, aggregator, sync server action. **Dropped** for v1 because:

- GitHub GraphQL `contributionCalendar` already returns daily counts pre-aggregated for the last ~365 days. No need to re-aggregate ourselves.
- Redis 3600s TTL is fresh enough for a graph that changes slowly.
- Webhooks need OAuth scope upgrade (`admin:repo_hook`) + re-auth flow + public endpoint hardening — not justified for cosmetic dashboard widget.
- Custom Postgres table = data we'd have to keep in sync with GitHub's source of truth. Pure cache layer simpler.

## Architecture (Shipped)

```
[GitHub GraphQL contributionCalendar]
        ↓ (Octokit, on cache miss)
[githubService.getContributionsHeatmap]
        ↓ (Redis 3600s, per-user key)
[ContributionHeatmap RSC]
        ↓ (props.data)
[ContributionHeatmapGrid client SVG]
```

## Visual Result

- Heatmap card (col-span-3) and 28-day chart card (col-span-2) side-by-side on `xl:` viewports, stacked below.
- Both cards `h-full`; chart `flex flex-1 items-center` so heights match.
- 5 color buckets: muted / green-200 / green-400 / green-600 / green-800 (dark mode inverted).

## Research Reports (Retained for v2 Reference)

- [GitHub API strategy](../reports/researcher-260510-2321-github-api-contribution-graph.md) — webhooks, GraphQL backfill cost
- [Heatmap visualization](../reports/researcher-260510-2322-contribution-graph-heatmap.md) — custom SVG vs libs, a11y, React 19 compiler notes
- [Activity schema](../reports/researcher-260510-2322-activity-tracking-schema.md) — Postgres table design, upsert patterns

## v2 Backlog (Not Scheduled)

Escalate to a new plan (`260XXX-contribution-graph-v2`) only when one of these triggers:

| Trigger | What v2 must add |
|---------|------------------|
| Want commits / PRs / issues split out (not summed) | Postgres `user_activity_daily` table + GraphQL `commitContributionsByRepository` ingestion |
| Want <1h freshness without short Redis TTL | Webhook handler at `/api/webhooks/github` + HMAC verify + delivery dedupe |
| Want >1 year history | Same as above + month-by-month backfill chunks |
| Want offline/portable backup of contribution data | Persistence layer |

Until then: GraphQL + Redis cache is the right answer.

## Open Questions

1. Click-through interactions on cells (filter dashboard by date)? Deferred to v2 if added at all.
2. Color-blind palette toggle in user settings? Defer until requested.
3. Mobile touch targets (11px cells) — currently scroll-only; accept as v1 limitation.
