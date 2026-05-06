# Project Overview & PDR

> Product Development Requirements for **MaurelDev** — a self-hosted, multi-user GitHub dashboard.

## 1. Vision

A personal/team replacement for the GitHub web UI focused on the workflows the user actually performs daily: scanning repos, triaging issues/PRs, watching stars, browsing Projects v2 and Packages, and creating new repos. Self-hosted on Dokploy so each user owns their data and OAuth credentials.

## 2. Problem Statement

GitHub's UI is broad and noisy. Personal dashboards (Linear-like) compress information density and let teams pin context (active org, pinned repos, view defaults). Existing alternatives (Sourcegraph, gh CLI, Refined GitHub) either require enterprise plans, are CLI-only, or run in-browser without server-side caching/aggregation.

## 3. Target Users

- Solo developers managing several repos across personal + org accounts.
- Small teams self-hosting on a Dokploy-managed VPS.
- Power users who want fewer clicks between "open dashboard" and "see what changed today".

## 4. Functional Requirements (MVP — Phases 1-7, shipped to `develop`)

| Area | Capability |
|------|------------|
| Auth | GitHub OAuth via Better Auth. Encrypted access token (AES-256-GCM) per user. Account revocation deletes user + cascades sessions. |
| Context | User can switch between personal account and any org they belong to. Active context persisted via httpOnly cookie. |
| Overview | Dashboard with metrics (repos, stars, open PRs, open issues) for the active context, plus recently updated repos. |
| Repositories | List with filters (search, language, visibility, sort), pagination. Pin/unpin to surface in a dedicated section. New-repo dialog (name, description, private, auto-init). Detail view with tabs (overview, issues, pulls). |
| Stars | Paginated list of starred repos with `starred_at` timestamp. |
| Projects | GitHub Projects v2 listing via GraphQL (`viewer.projectsV2`). |
| Packages | GitHub Packages by type (container/npm/maven/rubygems/nuget). Permission-error guidance when scope missing. |
| Settings | Theme (light/dark/system), pinned repos management, GitHub access revocation. |
| Health | `/api/health` returns DB + Redis status (used by Dokploy probes). |

## 5. Non-Functional Requirements

- **Performance**: Octokit calls cached in Redis with ETag revalidation. TTLs tuned per resource (60s–1h). 304 responses refresh TTL without re-fetching body.
- **Security**: OAuth tokens never stored as plaintext at rest (Better Auth hook re-encrypts post-handshake). Token-encryption key required (32-byte hex). Session cookies are httpOnly + secure in production. Protected routes gated by Next middleware.
- **Reliability**: Lazy DB/Redis/Auth proxies so build-time page-data collection never crashes on missing env vars. Health endpoint pings both stores.
- **Multi-user isolation**: Cache keys namespaced by `userId` (`gh:{userId}:{resource}:{paramHash}`). Cross-user cache leakage impossible by construction.
- **DX**: TypeScript strict, Drizzle ORM for schema + migrations, shadcn/ui (new-york style) on Tailwind v4.

## 6. Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 16 (App Router, RSC, server actions) | Modern primitives, standalone build for Docker. |
| Language | TypeScript 5 | Type safety. |
| UI | Tailwind v4 + shadcn/ui (Radix) + Lucide icons | Accessible primitives, themeable. |
| Auth | Better Auth + Drizzle adapter | OAuth + session DB integration. |
| GitHub | Octokit REST + `@octokit/graphql` | Coverage of REST + Projects v2. |
| DB | Postgres 16 + Drizzle ORM | Typed queries + migrations. |
| Cache | Redis 7 (`ioredis`) | Per-user GitHub response cache + ETag store. |
| Validation | Zod 4 | Env + form input validation. |
| Deploy | Docker (multi-stage) + Dokploy + standalone Next output | Self-hosted. |
| Pkg mgr | pnpm 10 | Workspaces + lockfile. |

## 7. Out of Scope (MVP)

- Notifications inbox.
- Global search (Cmd+K).
- GitHub App migration (rate-limit 15k/h + repo selection UI). Deferred to post-MVP.
- Issue/PR comment authoring (read-only currently). Tracked in post-MVP phase 5.
- GitHub Actions runs viewer. Tracked in post-MVP phase 6.

## 8. Success Metrics

- Sign-in → first overview render < 2s warm cache.
- Cache hit rate (304 + Redis hits) > 70% over a typical session.
- Zero plaintext tokens in `account.access_token` after OAuth callback completes.
- Health endpoint returns 200 in steady state on Dokploy.

## 9. Open Risks

- GitHub OAuth App rate limit is 5k req/h per user. Heavy navigation could exhaust it; ETag mitigates but doesn't eliminate. Migration to GitHub App (15k/h) is the durable fix.
- Projects v2 GraphQL is rate-limited separately and lacks ETag — currently relies purely on Redis TTL.
- Octokit `console.error` of 304s was silenced via custom logger; future Octokit upgrade may need re-validation.
