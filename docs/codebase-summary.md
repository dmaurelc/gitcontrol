# Codebase Summary

> Snapshot of the repository as of 2026-05-07 — branch `develop`, 13,185 LOC across 122 TS/TSX files in `src/`.

## Top-Level Layout

```
maureldev/
├── src/                       # App + lib code
├── drizzle/                   # SQL migrations (auto-generated)
├── scripts/                   # entrypoint.sh + migrate.mjs (runtime)
├── plans/                     # Phased plans + reports (MVP + post-MVP)
├── docs/                      # This documentation set
├── public/                    # Static assets
├── Dockerfile                 # Multi-stage build (deps → builder → migrator → runner)
├── docker-compose.dev.yml     # Local Postgres 16 + Redis 7
├── drizzle.config.ts          # Drizzle Kit (schema → SQL)
├── next.config.ts             # standalone output + GitHub avatar remote patterns
├── components.json            # shadcn/ui config (new-york, neutral)
├── package.json               # pnpm scripts (dev, build, db:*, lint, format)
└── AGENTS.md                  # "Read Next.js 16 docs before coding" reminder
```

## `src/` Breakdown

```
src/
├── middleware.ts              # Auth guard for protected route prefixes
├── app/
│   ├── layout.tsx             # Root: Geist fonts + ThemeProvider
│   ├── page.tsx               # "/" → redirect to /login or /dashboard
│   ├── login/page.tsx         # GitHub sign-in button (better-auth client)
│   ├── (dashboard)/           # Authenticated shell (sidebar + topbar)
│   │   ├── layout.tsx         # Loads viewer/orgs, resolves active context
│   │   ├── _components/       # AppSidebar, Topbar, OrgSwitcher
│   │   ├── dashboard/         # Overview metrics + recent repos
│   │   ├── repositories/      # List, pinned, filters, new-repo dialog
│   │   │   ├── _components/   # RepoCard, RepoFilters, PinButton, etc.
│   │   │   └── [owner]/[repo]/  # Detail tabs (overview, issues, pulls)
│   │   ├── stars/             # Starred repos (paginated)
│   │   ├── projects/          # Projects v2 (GraphQL)
│   │   ├── packages/          # GitHub Packages by type
│   │   └── settings/          # Appearance + Account tabs
│   ├── actions/               # "use server" actions
│   │   ├── auth.ts            # signOutAction
│   │   ├── context.ts         # setActiveContext (cookie + revalidate)
│   │   ├── create-repo.ts     # createRepoAction (Zod validated)
│   │   └── settings.ts        # theme, pin/unpin, revoke
│   └── api/
│       ├── auth/[...all]/     # Better Auth handler (catch-all)
│       ├── health/            # DB + Redis ping (Dokploy probe)
│       └── debug/             # tables/, viewer/ (dev-only inspectors)
├── components/
│   ├── theme-provider.tsx     # next-themes wrapper
│   ├── theme-toggle.tsx       # Light/Dark/System dropdown
│   └── ui/                    # shadcn/ui primitives (16 components)
├── hooks/                     # (empty placeholder)
└── lib/
    ├── env.ts                 # Zod env schema + build-phase placeholder
    ├── utils.ts               # cn() helper
    ├── db/
    │   ├── client.ts          # Drizzle + pg Pool (lazy proxy)
    │   └── schema.ts          # user, session, account, verification, userPreferences
    ├── auth/
    │   ├── auth.ts            # Better Auth instance + post-create encryption hook
    │   ├── auth-client.ts     # React client (signIn, signOut, useSession)
    │   ├── encryption.ts      # AES-256-GCM encrypt/decrypt
    │   └── get-github-token.ts  # Decrypts token by userId
    ├── github/
    │   ├── client.ts          # Per-request Octokit + GraphQL bound to user token
    │   ├── service.ts         # githubService.* (viewer, orgs, repos, issues, etc.)
    │   ├── cache.ts           # Redis envelope cache + ETag revalidation
    │   └── errors.ts          # GithubError hierarchy + mapGithubError
    ├── redis/
    │   └── client.ts          # ioredis singleton
    ├── context/
    │   └── active-context.ts  # Cookie-based user/org switching
    └── preferences/
        └── get-user-preferences.ts  # Reads/creates userPreferences row
```

## Key Modules at a Glance

| Module | Role |
|--------|------|
| `lib/auth/auth.ts` | Better Auth config. Drizzle adapter. `databaseHooks.account.{create,update}.after` re-encrypts `accessToken` and clears the plaintext column. Lazy proxy avoids build-time env validation. |
| `lib/auth/encryption.ts` | AES-256-GCM helpers using `node:crypto`. JSON envelope: `{ ciphertext, iv, authTag }` (all base64). |
| `lib/github/service.ts` | Single object exporting all GitHub fetchers (REST + GraphQL). Each fetcher delegates to `cachedFetch` for ETag-aware caching. ~490 LOC, biggest file in repo. |
| `lib/github/cache.ts` | `cachedFetch<T>()` wraps a fetcher with Redis. Cache key: `gh:{userId}:{resource}:{sha256(params)[0:16]}`. ETag stored alongside body. 304 → refresh TTL only. `invalidate()` uses `scanStream` + pipeline. |
| `lib/context/active-context.ts` | `getActiveContext(userId, fallback)` returns user or org context, validated against the user's actual orgs to prevent stale cookies. |
| `app/(dashboard)/layout.tsx` | Loads viewer + orgs in parallel (best-effort) and renders the shell. Renders unauthenticated → redirect to `/login`. |
| `app/actions/settings.ts` | All preference mutations + `revokeAccessAction` (wipes cache → deletes account row → deletes user → signs out). |
| `middleware.ts` | Edge middleware. Protects `/dashboard`, `/repositories`, `/stars`, `/projects`, `/packages`, `/orgs`, `/settings`. Uses `better-auth/cookies.getSessionCookie` for session presence. |

## Database Tables (Drizzle)

| Table | Purpose |
|-------|---------|
| `user` | Better Auth core user record. |
| `session` | Better Auth session. Cascades on user delete. |
| `account` | OAuth provider link. Adds `encrypted_access_token` column on top of Better Auth's defaults. |
| `verification` | Better Auth email/identifier verification (currently unused but adapter requires it). |
| `user_preferences` | Per-user prefs: theme, defaultView, pinnedRepos (jsonb), filters (jsonb). |

Migration files live in `drizzle/` and are applied at container start by `scripts/entrypoint.sh` → `scripts/migrate.mjs` (executed from `/app/migrator` with its own `node_modules` to satisfy ESM resolution for `drizzle-orm` + `pg`).

## Routing Map

| Path | Type | Notes |
|------|------|-------|
| `/` | RSC | Redirects to `/dashboard` (or `/login`). |
| `/login` | RSC + client | OAuth start. |
| `/dashboard` | RSC | Metrics + recent repos with KPI links + dashboard tweaks. |
| `/repositories` | RSC | List + filters. Hidden pinned repos from listing. |
| `/repositories/[owner]/[repo]` | RSC layout | Tabs nav (overview, issues, pulls, files, insights). |
| `/repositories/[owner]/[repo]/overview` | RSC | Repo detail with releases, tags, contributors sidebar. |
| `/repositories/[owner]/[repo]/issues` | RSC | Repo issues. |
| `/repositories/[owner]/[repo]/pulls` | RSC | Repo PRs. |
| `/repositories/[owner]/[repo]/files` | RSC | File browser + preview. |
| `/repositories/[owner]/[repo]/insights` | RSC | Commit activity, code frequency, traffic. |
| `/issues` | RSC | Cross-repo aggregated issues view. |
| `/pulls` | RSC | Cross-repo aggregated PRs view. |
| `/activity` | RSC | Viewer events page with pagination. |
| `/stars` | RSC | Paginated starred repos with `starred_at`. |
| `/projects` | RSC | Projects v2 (GraphQL). |
| `/packages` | RSC | GitHub Packages by type. |
| `/notifications` | RSC | Notification inbox with mark-all-read. |
| `/actions` | RSC | GitHub Actions runs viewer (phase 06). |
| `/settings` | RSC | Tabs: Appearance, Account. |
| `/api/auth/[...all]` | API | Better Auth catch-all. |
| `/api/health` | API | `force-dynamic`. DB + Redis status. |
| `/api/debug/{tables,viewer}` | API | Dev-only inspectors (post-MVP phase 3 will remove from prod). |

## Git Workflow

See [`docs/git-workflow.md`](./git-workflow.md). Default branch `main`. Feature work branches off `develop`, merges back via PR. Releases promote `develop` → `main` via PR.

## Plans Index

- `plans/260506-1300-github-dashboard/` — MVP (7 phases, all merged to `develop`).
- `plans/260506-1818-post-mvp-improvements/` — visibility filters, stars filters, prod cleanup, UI redesign, comments, Actions runs.
- `plans/260507-1253-repo-detail-expansion/` — Files tab, Insights tab, Releases/Tags/Contributors aside (merged).
