# Project Roadmap

> Living document. Updated 2026-05-17.

## Status Snapshot

- **MVP (phases 1-7)**: ✅ shipped. Commit `74358d0`.
- **Post-MVP Wave 1**: ✅ shipped. Visibility + stars filters, Actions viewer, debug cleanup.
- **Post-MVP Wave 2**: ✅ shipped. Repo detail expansion (files, insights, releases, tags, contributors).
- **Post-MVP Wave 3**: ✅ shipped. Dashboard polish, activity, notifications, cross-repo views.
- **Post-MVP Wave 4**: ✅ shipped. Full UI/UX redesign, comments, issue/PR detail.
- **Post-MVP Wave 5**: ✅ shipped (2026-05-08). Power-user UX (view toggle, sync badge, devicons, health, Cmd+K, dependency tracker).
- **Post-MVP Wave 6**: ✅ shipped (2026-05-12). Contribution heatmap, commit history, changelog page.
- **Post-MVP Wave 7**: ✅ shipped (2026-05-15). In-app PR merge, repo code explorer, landing page redesign, SEO/OG.
- **Post-MVP Wave 8**: ✅ shipped (2026-05-17). Vercel + Neon as primary deploy target (dual DB driver, optional Redis, automated migrations in build).
- **Version**: v0.11.0. Live at `https://gitcontrol-dev.vercel.app` (Vercel + Neon).
- **Active phase**: backlog grooming. Next: GitHub App migration, rate-limit banner, saved searches.

## Completed Milestones

### MVP — `plans/260506-1300-github-dashboard/`

| # | Phase | PR / Commit | Status |
|---|-------|-------------|--------|
| 1 | Setup base (Next 16, DB, Redis, Drizzle, Docker scaffolding) | (initial) | ✅ |
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

## Completed Post-MVP (Wave 5) — Power-user UX + Dependency Tracker

`plans/260508-1124-wave-5-sprint/`. Sprint derived from `plans/reports/scout-260508-1035-devdock-crmdev-ideas.md`.

| # | Phase | Notes | Status | PR |
|---|-------|-------|--------|-----|
| 1 | View mode toggle (grid/list) | persisted in `user_preferences.filters.viewMode` jsonb; `/repositories` + `/stars` | ✅ | #46 |
| 2 | Sync status badge | exposes Redis `fetchedAt` + TTL on `/repositories` and `/stars`; click to revalidate | ✅ | #48 |
| 3 | Devicon language stack | top-2 icons + "+N" overflow on cards/rows; backed by `getLanguages` byte-share | ✅ | #50 |
| 4 | Repo health badge | quick health from `pushed_at` on cards; full orchestrator (`getRepoHealth`) reserved for overview panel | ✅ | #51 |
| 5 | Cmd+K org repo index | viewer + every active org, dedup by id, fuzzy on name + description + language | ✅ | #52 |
| 6 | Dependency tracker | per-repo `/dependencies` tab via Dep Graph GraphQL + npm-latest cross-check; severity filter; auto-issue dialog | ✅ | #53 |

Supporting docs/infra:
- #44 Wave 5 sprint plan + scout report (docs)
- #45 perPage selector recovery (rescued from orphaned branch)
- #47 git-workflow sync-back doc
- #49 mid-sprint progress update

## Completed Post-MVP (Wave 6) — Contribution Graph & Commits

Commits delivered 2026-05-11 to 2026-05-12 (PR #73, #72, related commits 85a564a–b195320).

| # | Phase | Notes | Status | Commit |
|---|-------|-------|--------|--------|
| 1 | Contribution heatmap SVG component | 365-day grid, year selector | ✅ | `7c87d2e` |
| 2 | GitHub API aggregation (getContributionsHeatmap) | REST endpoint integration | ✅ | `b195320` |
| 3 | Dashboard layout (heatmap + 28-day chart) | 60/40 grid pairing | ✅ | `6d1d7a0` |
| 4 | Commit history view with filters | branch, author, date selectors | ✅ | `56efb9d` |
| 5 | Changelog page (Release workflow) | auto-generated from GitHub Releases | ✅ | deployed |
| — | Styling alignment (chart-1 token) | design consistency | ✅ | `c1a1deb` |

## Completed Post-MVP (Wave 7) — In-app Merge + Code Explorer + Landing

Commits delivered 2026-05-10 to 2026-05-15.

| # | Phase | Notes | Status |
|---|-------|-------|--------|
| 1 | In-app PR merge | Merge PRs without leaving the app | ✅ |
| 2 | Repo code explorer | Split-view explorer alternative to tabbed repo detail | ✅ |
| 3 | Landing page redesign | New landing for signed-out visitors | ✅ |
| 4 | SEO + OG metadata | Site-wide metadata, robots, sitemap, OG image with GitControl branding | ✅ |
| 5 | Auth redirect cleanup | Signed-out users land directly on `/` | ✅ |

## Completed Post-MVP (Wave 8) — Vercel + Neon Migration

Branch `staging` → merged to `main` (v0.11.0).

| # | Phase | Notes | Status |
|---|-------|-------|--------|
| 1 | Vercel project + Neon provisioning | `vercel.json`, env schema updates | ✅ |
| 2 | Dual DB driver (`node-postgres` + `@neondatabase/serverless`) | Selected by `DB_DRIVER` env | ✅ |
| 3 | Optional Redis cache via `CACHE_ENABLED` flag | Off by default on Vercel — zero infra | ✅ |
| 4 | Migrations in `pnpm vercel-build` | Runs against `MIGRATION_DATABASE_URL` (Neon unpooled) | ✅ |
| 5 | Deploy gated to `main` only | `vercel.json:git.deploymentEnabled.main` | ✅ |
| 6 | Docs rewrite (Vercel + Neon only) | README, deployment-guide, architecture, roadmap | ✅ |

## In Progress

_No active phase. Pick next item from backlog._

## Backlog (Not Yet Planned)

- **GitHub App migration** — replaces OAuth App. 15k req/h vs 5k, per-repo scope, no blanket `repo`. Full re-onboarding required.
- **Rate-limit banner** — surface `RateLimitError` with `retryAfterSeconds` instead of silent swallow.
- **Cmd+K issues + PRs** — extend index beyond repos (currently org repo index only).
- **Saved searches** — persist common filter combos in `user_preferences.filters`.
- **Multi-language outdated tracking** — extend dep tracker beyond npm (PyPI, Go, Maven).
- **Repo health breakdown panel** — full `getRepoHealth` orchestrator on repo overview.
- **Telemetry/observability** — structured logging + Prometheus metrics endpoint.
- **Mobile sidebar sheet** — hamburger nav for mobile < md breakpoint.

## Non-Goals

- Multi-tenant SaaS (no billing, no admin panel). Self-host only.
- Replacing Git client features (push/pull, branch ops). Read-mostly.
- Replicating the full GitHub UI surface.

## Key Risks Tracked

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OAuth rate limit exhaustion (5k/h) | medium | high | ETag caching today (when Redis on); GitHub App migration long-term. |
| Projects v2 GraphQL has no ETag | medium | low | Pure TTL cache (300s) when enabled — accept slight staleness. |
| Neon cold start | low | low | ~300ms first request after idle; paid tier eliminates it. |
| Token leak via `/api/debug/*` in prod | — | — | ✅ resolved — debug routes removed. |

## Cadence

- One post-MVP phase per iteration. Keep PRs scoped per phase file.
- Update this roadmap at the close of each phase. The in-app `/changelog` page is auto-published from GitHub Releases via `.github/workflows/release.yml`.
