# Codebase Summary

> Snapshot of the repository as of 2026-05-17 — branch `main`, v0.11.0 shipped. Stack: Next.js 16 + Postgres (Neon) on Vercel.

## Top-Level Layout

```
gitcontrol/
├── src/                       # App + lib code
├── drizzle/                   # SQL migrations (auto-generated)
├── scripts/                   # migrate.mjs (runtime/build) + entrypoint.sh (legacy)
├── plans/                     # Phased plans + reports (MVP + post-MVP)
├── docs/                      # This documentation set
├── public/                    # Static assets
├── vercel.json                # Vercel build/install/git config
├── drizzle.config.ts          # Drizzle Kit (schema → SQL)
├── next.config.ts             # GitHub avatar remote patterns
├── components.json            # shadcn/ui config (new-york, neutral)
├── package.json               # pnpm scripts (dev, vercel-build, db:*, lint, format)
└── AGENTS.md                  # "Read Next.js 16 docs before coding" reminder
```

`Dockerfile` and `docker-compose.dev.yml` remain in the repo but are no longer part of the supported deploy path — the current target is Vercel + Neon.

## `src/` Breakdown

```
src/
├── middleware.ts              # Auth guard for protected route prefixes
├── app/
│   ├── layout.tsx             # Root: fonts + ThemeProvider + metadata/OG
│   ├── page.tsx               # "/" → landing (signed out) or /dashboard
│   ├── login/page.tsx         # GitHub sign-in button (better-auth client)
│   ├── (dashboard)/           # Authenticated shell (sidebar + topbar)
│   │   ├── layout.tsx         # Loads viewer/orgs, resolves active context
│   │   ├── _components/       # AppSidebar, Topbar, OrgSwitcher
│   │   ├── dashboard/         # Overview metrics + recent repos + heatmap
│   │   ├── repositories/      # List, pinned, filters, new-repo dialog
│   │   │   ├── _components/   # RepoCard, RepoFilters, PinButton, etc.
│   │   │   └── [owner]/[repo]/  # Detail tabs (overview, issues, pulls, files, insights, commits, dependencies)
│   │   ├── stars/             # Starred repos (paginated)
│   │   ├── projects/          # Projects v2 (GraphQL)
│   │   ├── packages/          # GitHub Packages by type
│   │   ├── activity/          # Viewer events
│   │   ├── notifications/     # Notification inbox
│   │   ├── actions/           # GitHub Actions runs
│   │   ├── changelog/         # Auto-published release history
│   │   ├── report-bug/        # Bug report form
│   │   └── settings/          # Appearance + Account tabs
│   ├── actions/               # "use server" actions
│   │   ├── auth.ts            # signOutAction
│   │   ├── context.ts         # setActiveContext (cookie + revalidate)
│   │   ├── create-repo.ts     # createRepoAction (Zod validated)
│   │   └── settings.ts        # theme, pin/unpin, revoke
│   └── api/
│       ├── auth/[...all]/     # Better Auth handler (catch-all)
│       └── health/            # DB ping (Vercel/uptime probe)
├── components/
│   ├── theme-provider.tsx     # next-themes wrapper
│   ├── theme-toggle.tsx       # Light/Dark switch
│   ├── theme-toggle-icon.tsx  # Icon-button variant (cycles light↔dark)
│   └── ui/                    # shadcn/ui primitives
├── hooks/                     # (utility hooks)
└── lib/
    ├── env.ts                 # Zod env schema + build-phase placeholder + CACHE_ENABLED flag
    ├── utils.ts               # cn() helper
    ├── db/
    │   ├── client.ts          # Drizzle + dual driver (node-pg or @neondatabase/serverless)
    │   └── schema.ts          # user, session, account, verification, userPreferences
    ├── auth/
    │   ├── auth.ts            # Better Auth instance + post-create encryption hook
    │   ├── auth-client.ts     # React client (signIn, signOut, useSession)
    │   ├── encryption.ts      # AES-256-GCM encrypt/decrypt
    │   └── get-github-token.ts  # Decrypts token by userId
    ├── github/
    │   ├── client.ts          # Per-request Octokit + GraphQL bound to user token
    │   ├── service.ts         # githubService.* (viewer, orgs, repos, issues, etc.)
    │   ├── cache.ts           # Redis envelope cache + ETag revalidation (no-op when CACHE_ENABLED=false)
    │   └── errors.ts          # GithubError hierarchy + mapGithubError
    ├── redis/
    │   └── client.ts          # ioredis singleton (lazy, only constructed if CACHE_ENABLED)
    ├── context/
    │   └── active-context.ts  # Cookie-based user/org switching
    └── preferences/
        └── get-user-preferences.ts  # Reads/creates userPreferences row
```

## Key Modules at a Glance

| Module | Role |
|--------|------|
| `lib/env.ts` | Zod env schema. `DB_DRIVER` selects driver. `CACHE_ENABLED` gates Redis. Build-phase placeholders prevent build crashes on missing env vars. |
| `lib/db/client.ts` | Lazy Drizzle proxy. If `DB_DRIVER=neon`, uses `@neondatabase/serverless` (websocket pool); otherwise `pg.Pool`. |
| `lib/auth/auth.ts` | Better Auth config. Drizzle adapter. `databaseHooks.account.{create,update}.after` re-encrypts `accessToken` and clears the plaintext column. |
| `lib/auth/encryption.ts` | AES-256-GCM helpers using `node:crypto`. JSON envelope: `{ ciphertext, iv, authTag }` (all base64). |
| `lib/github/service.ts` | Single object exporting all GitHub fetchers (REST + GraphQL). Each delegates to `cachedFetch`. |
| `lib/github/cache.ts` | `cachedFetch<T>()` wraps a fetcher with Redis + ETag. Pass-through when `CACHE_ENABLED=false`. |
| `lib/context/active-context.ts` | `getActiveContext(userId, fallback)` validates active context against the user's actual orgs to prevent stale cookies. |
| `app/(dashboard)/layout.tsx` | Loads viewer + orgs in parallel (best-effort) and renders the shell. |
| `app/actions/settings.ts` | All preference mutations + `revokeAccessAction` (wipes cache → deletes account row → deletes user → signs out). |
| `middleware.ts` | Protects `/dashboard`, `/repositories`, `/stars`, `/projects`, `/packages`, `/orgs`, `/settings`. Uses `better-auth/cookies.getSessionCookie`. |
| `scripts/migrate.mjs` | Standalone migration runner. Selects driver via `DB_DRIVER`. Runs in `pnpm vercel-build` before `next build`. |

## Database Tables (Drizzle)

| Table | Purpose |
|-------|---------|
| `user` | Better Auth core user record. |
| `session` | Better Auth session. Cascades on user delete. |
| `account` | OAuth provider link. Adds `encrypted_access_token` column on top of Better Auth's defaults. |
| `verification` | Better Auth email/identifier verification (currently unused but adapter requires it). |
| `user_preferences` | Per-user prefs: theme, defaultView, pinnedRepos (jsonb), filters (jsonb). |

Migration files live in `drizzle/` and are applied automatically by `scripts/migrate.mjs` during `pnpm vercel-build`.

## Routing Map

| Path | Type | Notes |
|------|------|-------|
| `/` | RSC | Landing (signed out) or redirect to `/dashboard` (signed in). |
| `/login` | RSC + client | OAuth start. |
| `/dashboard` | RSC | Metrics + recent repos with KPI links + contribution heatmap. |
| `/repositories` | RSC | List + filters. Hidden pinned repos from listing. |
| `/repositories/[owner]/[repo]` | RSC layout | Tabs nav (overview, issues, pulls, files, insights, commits, dependencies). |
| `/repositories/[owner]/[repo]/overview` | RSC | Repo detail with releases, tags, contributors sidebar. |
| `/repositories/[owner]/[repo]/issues` | RSC | Repo issues. |
| `/repositories/[owner]/[repo]/pulls` | RSC | Repo PRs. In-app merge supported. |
| `/repositories/[owner]/[repo]/files` | RSC | File browser + preview + code explorer mode. |
| `/repositories/[owner]/[repo]/insights` | RSC | Commit activity, code frequency, traffic. |
| `/repositories/[owner]/[repo]/commits` | RSC | Commit history with branch/author/date filters. |
| `/repositories/[owner]/[repo]/dependencies` | RSC | Dep Graph + npm-latest with severity filter. |
| `/issues` | RSC | Cross-repo aggregated issues view. |
| `/pulls` | RSC | Cross-repo aggregated PRs view. |
| `/activity` | RSC | Viewer events page with pagination. |
| `/stars` | RSC | Paginated starred repos with `starred_at`. |
| `/projects` | RSC | Projects v2 (GraphQL). |
| `/packages` | RSC | GitHub Packages by type. |
| `/notifications` | RSC | Notification inbox with mark-all-read. |
| `/actions` | RSC | GitHub Actions runs viewer. |
| `/changelog` | RSC | GitHub Release history (auto-published via workflow). |
| `/report-bug` | RSC | Bug report form (issue auto-create). |
| `/settings` | RSC | Tabs: Appearance, Account. |
| `/api/auth/[...all]` | API | Better Auth catch-all. |
| `/api/health` | API | `force-dynamic`. DB status. |

## Git Workflow

See [`docs/git-workflow.md`](./git-workflow.md). Default branch `main`. Feature work branches off `develop`, merges back via PR. Releases promote `develop` → `main` via PR. Vercel auto-deploys only on push to `main` (`vercel.json:git.deploymentEnabled.main`).

## Plans Index

- `plans/260506-1300-github-dashboard/` — MVP (7 phases, all merged).
- `plans/260506-1818-post-mvp-improvements/` — visibility filters, stars filters, prod cleanup, UI redesign, comments, Actions runs.
- `plans/260507-1253-repo-detail-expansion/` — Files tab, Insights tab, Releases/Tags/Contributors aside.
- `plans/260508-1124-wave-5-sprint/` — view-mode toggle, sync-status badge, Devicon stack, repo health, Cmd+K org index, dependency tracker.
- `plans/260510-1230-in-app-pr-merge/` — in-app PR merge.
- `plans/260510-2321-contribution-graph-heatmap/` — 365-day heatmap.
- `plans/260512-1617-landing-page-design/` — landing page redesign.
- `plans/260515-1108-repo-code-explorer/` — repo code explorer view.
- `plans/260516-1527-vercel-neon-staging/` — Vercel + Neon migration (current default deploy target).

## Recent Highlights (v0.10.0 → v0.11.0)

- Vercel + Neon as the primary deploy path (`scripts/migrate.mjs`, `vercel.json`, dual DB driver, `CACHE_ENABLED` flag).
- Repo code explorer view alongside the classic tabbed layout.
- Site-wide SEO metadata, OG image, robots, sitemap.
- Landing page redesign + GitControl logo / brand colors on OG image.
- Auth redirect cleanup: signed-out users now land directly on `/`.
