# Project Roadmap

> Living document. Updated 2026-05-06.

## Status Snapshot

- **MVP (phases 1-7)**: ✅ shipped to `develop`. Last commit `74358d0`.
- **Production deploy**: live at `https://dev.webkode.cl` (per post-MVP plan).
- **Active phase**: post-MVP improvements — pending kick-off.

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

## In Progress

### Post-MVP — `plans/260506-1818-post-mvp-improvements/`

| # | Phase | Priority | Status |
|---|-------|----------|--------|
| 1 | Visibility filters (orgs + repos) | quick win | pending |
| 2 | Stars filters & sort | quick win | pending |
| 3 | Cleanup prod (remove `/api/debug/*`) | quick win, prod hygiene | pending |
| 4 | UI/UX redesign (sidebar, cards, typography) | bigger scope; pair with `/ui-ux-pro-max` | pending |
| 5 | Issue/PR comments + create issue | feature | pending |
| 6 | GitHub Actions runs viewer | feature | pending |

**Build order**: 1-3 first (all small, low-risk). Then 4 alone. 5 + 6 can be parallelized after 4 lands.

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
