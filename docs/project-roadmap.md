# Project Roadmap

> Living document. Updated 2026-05-07.

## Status Snapshot

- **MVP (phases 1-7)**: ✅ shipped to `develop`. Commit `74358d0`.
- **Post-MVP phase 1-2 + expansion (phases 1-7 from new wave)**: ✅ shipped. Commit `dc3b804` (PR #37).
- **Production deploy**: live at `https://dev.webkode.cl` (Dokploy).
- **Active phase**: Additional post-MVP improvements — features (comments, more Actions enhancements) pending.

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
| 1 | Visibility filters (orgs + repos) | quick win | ✅ pending | TBD |
| 2 | Stars filters & sort | quick win | ✅ pending | TBD |
| 3 | Cleanup prod (remove `/api/debug/*`) | quick win, prod hygiene | ⏳ pending | TBD |
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

## In Progress

### Post-MVP Phase 4 — UI/UX Redesign

| # | Phase | Priority | Status |
|---|-------|----------|--------|
| 4 | Full UI/UX redesign (sidebar, cards, typography) | bigger scope | pending |
| 5 | Issue/PR comments + create issue | feature | pending |

**Build order**: Phase 4 (redesign) alone. Phase 5 (comments) after 4 stabilizes.

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
| Token leak via `/api/debug/*` in prod | low | critical | Post-MVP phase 3 removes those routes before broader rollout. |

## Cadence

- One post-MVP phase per iteration. Keep PRs scoped per phase file.
- Update this roadmap (and `project-changelog.md` once it exists) at the close of each phase.
