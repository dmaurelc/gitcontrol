# Phase 07 — Dashboard Polish: Implementation Report

## Status: DONE

## Commits (branch `feat/phase-07-dashboard-polish`)

| # | SHA | Message |
|---|-----|---------|
| 7a | 6b6cee6 | feat(ui): sidebar user card footer + theme toggle in topbar |
| 7b | 01dffee | feat(dashboard): real activity feed from GitHub events |
| 7c | 1ffcfa6 | feat(notifications): bell + dropdown with mark-as-read |
| 7d | b4bdbab | feat(search): ⌘K command palette with repos + quick nav |
| 7e | 416cecc | feat(dashboard): contributions chart (last 28 days) |
| fix | 89e915b | fix(lint): remove unused ResponsiveContainer import |

## Files Created

| File | Role |
|------|------|
| `src/components/sidebar-user-card.tsx` | Avatar + login + email + DropdownMenu (Settings link, Sign out) for sidebar footer |
| `src/components/theme-toggle-icon.tsx` | Single icon-only Button cycling light→dark→system, syncs to DB via `updateThemeAction` |
| `src/components/activity-feed.tsx` | RSC. Renders last 15 viewer events with icons + relative timestamps. Empty state on error. |
| `src/components/notifications-bell.tsx` | Client. Bell icon + unread badge + DropdownMenu. Optimistic mark-read with revert on error. |
| `src/components/command-palette.tsx` | Client. ⌘K / Ctrl+K global listener (skips input/textarea/contenteditable). CommandDialog with Quick Links + Repos groups. |
| `src/components/command-palette-server.tsx` | RSC wrapper. Fetches top-100 repos and passes to `CommandPalette`. |
| `src/components/contributions-chart.tsx` | Client. `ChartContainer` + recharts `BarChart` over last 28 days. Empty state on zero data. |
| `src/components/ui/chart.tsx` | Installed via `shadcn add chart` (recharts 3.8.0) |
| `src/app/actions/notifications.ts` | `markNotificationReadAction(formData)` — Zod-validates threadId, requireUserId pattern. |

## Files Modified

| File | Change |
|------|--------|
| `src/app/(dashboard)/_components/app-sidebar.tsx` | Replaced "v0.1 — self-hosted" footer with `<SidebarUserCard>`. Added optional `user` prop. |
| `src/app/(dashboard)/_components/mobile-sidebar.tsx` | Added `user` prop, forwards to `AppSidebar`. |
| `src/app/(dashboard)/_components/topbar.tsx` | Added `userId` prop; made `async` RSC to fetch notifications. Added `NotificationsBell`, `ThemeToggleIcon`, `CommandPaletteServer`. Removed static disabled search button. |
| `src/app/(dashboard)/layout.tsx` | Passes `user` to `AppSidebar`, `userId` to `Topbar`. |
| `src/app/(dashboard)/dashboard/page.tsx` | Replaced `ActivityCard` placeholder with real `ActivityFeed` + `Suspense`. Added `ContributionsSection` + `ContributionsSkeleton` below the main grid. |
| `src/lib/github/service.ts` | Added types (`ViewerEvent`, `GitHubNotification`, `ContributionDay`) + 4 service methods: `listViewerEvents`, `listNotifications`, `markNotificationRead`, `getContributionsCalendar`. |
| `package.json` / `pnpm-lock.yaml` | recharts 3.8.0 added by `shadcn add chart`. |

## Build & Lint

- `pnpm tsc --noEmit`: clean
- `pnpm lint`: clean (0 errors, 0 warnings after fix)
- `pnpm build`: green — 19 routes compiled successfully

## Design Decisions / Deviations

1. **Topbar made `async`** — Simplest approach to server-fetch notifications without an extra wrapper component. No `"use client"` needed; ThemeToggleIcon and NotificationsBell are client leaves.
2. **`listViewerEvents` swallows API errors** — Returns `{ notModified: false, body: [] }` instead of re-throwing; events endpoint may lack scope; empty state shown instead of error boundary.
3. **`listNotifications` same pattern** — Notifications scope (`notifications`) may be absent in existing OAuth tokens. Returns empty list; bell renders without badge.
4. **`getContributionsCalendar` throws via `mapGithubError`** — GraphQL contributions query is authenticated viewer-only (always has access); legitimate errors should surface. Callers wrap in try/catch.
5. **Topbar avatar dropdown retained** — Spec said to add Settings + Sign out to the sidebar user card; the topbar dropdown still has Sign out only (unchanged from MVP), which is fine for quick access.
6. **`CommandPaletteServer` Suspense** — Not wrapped in Suspense in topbar; repos are already cached (300s TTL) so the wait is negligible. Adding Suspense would cause a layout shift on the search button.

## Unresolved Questions

- None blocking. Notifications + events scope gaps handled gracefully with empty states.
