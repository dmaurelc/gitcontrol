# Project Roadmap

> Living document. Updated 2026-05-07.

## Status Snapshot

- **MVP (phases 1-7)**: ✅ shipped to `develop`. Commit `74358d0`.
- **Post-MVP Wave 1 (visibility filters, stars filters, Actions runs viewer, debug cleanup)**: ✅ shipped.
- **Post-MVP Wave 2 — Repo Detail Expansion**: ✅ shipped. Commit `dc3b804` (PR #37).
- **Post-MVP Wave 3 — Dashboard & Activity**: ✅ shipped.
- **Post-MVP Wave 4 — UI/UX Redesign + Comments**: ✅ shipped (PRs #23, #26).
- **UX hardening (typed errors, toasts, empty states)**: ✅ `dfdf097`.
- **Production deploy**: live at `https://dev.webkode.cl` (Dokploy).
- **Active phase**: backlog grooming — no phase actively in flight.

## Completed Milestones

### MVP — `plans/260506-1300-github-dashboard/`

| # | Phase | PR / Commit | Status |
|---|-------|-------------|--------|
| 1 | Setup base (Next 16, DB, Redis, Drizzle, Dokploy scaffolding) | (initial) | ✅ |
| 2 | Auth (Better Auth + GitHub OAuth + AES-256-GCM token encryption) | (phase-02) | ✅ |
| 3 | GitHubService (Octokit + Redis cache + ETags) | (phase-03) | ✅ |
| 4 | Overview + Org switcher | #4 `eed166d` | ✅ |
| 5 | Repositories (list, filters, detail tabs, issues, PRs, create repo) | #5 `d0a7080` | ✅ |
| 6 | Stars, Projects v2, Packages | #6 `437e3c6` | ✅ |
| 7 | Settings + preferences | #7 `a97af78` | ✅ |
| — | Hotfix: pinned repos render via RepoCard so PinButton actually shows | #8 `74358d0` | ✅ |

## Completed Post-MVP (Wave 1)

### Post-MVP Phase 1 — `plans/260506-1818-post-mvp-improvements/` (partial)

| # | Phase | Priority | Status | PR |
|---|-------|----------|--------|-----|
| 1 | Visibility filters (orgs + repos) | quick win | ✅ | — |
| 2 | Stars filters & sort | quick win | ✅ `f9a1bbc` | #22 |
| 3 | Cleanup prod (remove `/api/debug/*`) | quick win, prod hygiene | ✅ | — |
| 6 | GitHub Actions runs viewer | feature | ✅ `ced92cf` | #30 |

### Post-MVP Phase 2 — Repo Detail Expansion `plans/260507-1253-repo-detail-expansion/`

| # | Phase | Notes | Status | PR |
|---|-------|-------|--------|-----|
| 1 | Files tab with browser + preview | RSC file tree + syntax highlighting | ✅ `7852abe` | #37 |
| 2 | Insights tab (commit activity, code frequency, traffic) | GraphQL-backed analytics | ✅ `f57283c` | #37 |
| 3 | Releases, Tags, Contributors aside | Sidebar panels on repo detail | ✅ `2252e6b` | #37 |

### Post-MVP Phase 3 — Dashboard & Activity

| Phase | Notes | Status |
|-------|-------|--------|
| Dashboard KPI links + chart reorder | Metrics link to relevant pages | ✅ `879e083` |
| Activity page (viewer events) | Events list with pagination | ✅ `19a19d8` |
| Notifications page | Mark-all-read, full inbox UI | ✅ `bd737eb` |
| Cross-repo Issues + PRs | Aggregated views across all repos | ✅ `60c4c7e` |
| Sidebar enhancements | Workspace nav, "My GitHub" link | ✅ `d5361ec`, `bc23baf` |
| Theme palette lock | Lime/zinc, radius 0, IBM Plex Mono | ✅ `6afc761` |

## Completed Post-MVP (Wave 4) — UI/UX Redesign + Comments

| # | Phase | Notes | Status | PR |
|---|-------|-------|--------|-----|
| 4 | Full UI/UX redesign (tokens, shell, dashboard, cards) | sidebar, cards, typography | ✅ `e1c3080` | #23 |
| — | Pagination polish + dev accents + magic effects + new theme | follow-up polish | ✅ `c1e6afa` | #25 |
| 5 | Issue/PR detail, comments, close/reopen, new issue | feature | ✅ `3d366ca` | #26 |
| — | Dashboard polish (chart, activity, ⌘K, notifications, header/sidebar) | phase 07 | ✅ `39dcd2b` | #31 |
| — | Typed error handling + toasts + contextual empty states | UX hardening | ✅ `dfdf097` | — |
| — | Git workflow guide | docs | ✅ `687ea53` | #41 |

## In Progress

_No active phase. Pick next item from backlog._

## Backlog (Not Yet Planned)

- **GitHub App migration** — replaces OAuth App. Benefits: 15k req/h vs 5k, per-repo scope selection, no need for `repo` blanket scope. Cost: full re-onboarding of existing users.
- **Notifications inbox** — `/notifications` view backed by GitHub's notifications API.
- **Global search (Cmd+K)** — searchable index across repos / issues / PRs from cached data.
- **Telemetry/observability** — structured logging + Prometheus metrics endpoint.
- **Rate-limit banner** — surface `RateLimitError` with `retryAfterSeconds` to the user instead of swallowing.
- **Saved searches** — persist common filter combos in `user_preferences.filters`.

## Non-Goals

- Multi-tenant SaaS (no billing, no admin panel). Self-host only.
- Replacing Git client features (push/pull, branch ops). Read-mostly.
- Replicating the full GitHub UI surface.

## Key Risks Tracked

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OAuth rate limit exhaustion (5k/h) | medium | high | ETag caching today; GitHub App migration long-term. |
| Projects v2 GraphQL has no ETag | medium | low | Pure TTL cache (300s) — accept slight staleness. |
| Redis outage = page crash | low | high | Health endpoint flips to 503; Dokploy can restart. HA out of scope. |
| Token leak via `/api/debug/*` in prod | — | — | ✅ resolved — debug routes removed. |

## Cadence

- One post-MVP phase per iteration. Keep PRs scoped per phase file.
- Update this roadmap (and `project-changelog.md` once it exists) at the close of each phase.
