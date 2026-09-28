# System Architecture

> How the pieces fit together. Updated 2026-05-17. GitControl v0.11.0.

## 1. High-Level Topology

```
┌─────────────┐    HTTPS    ┌──────────────────────────────────┐
│   Browser   │◀───────────▶│  Vercel — Next.js 16 (Fluid)     │
└─────────────┘             │  • RSC pages + server actions    │
                            │  • Middleware (auth guard)       │
                            │  • API routes (auth, health)     │
                            └──────┬──────────────┬────────────┘
                                   │              │
                          better-auth│             │ Octokit
                          adapter   │              │ REST + GraphQL
                                   ▼              ▼
                            ┌────────────┐  ┌────────────┐
                            │  Neon DB   │  │ github.com │
                            │ (Postgres) │  └─────┬──────┘
                            └────────────┘        │ ETag-aware
                                                  │
                                   ┌──────────────┘
                                   ▼
                            ┌─────────────────────────┐
                            │  Optional Redis cache   │
                            │  (CACHE_ENABLED=true)   │
                            │  off by default on      │
                            │  Vercel                 │
                            └─────────────────────────┘
```

The Next app runs on Vercel (Fluid Compute, Node.js runtime). Postgres is hosted on Neon (websocket pool via `@neondatabase/serverless`). Redis is optional — gated by `CACHE_ENABLED` and disabled by default on Vercel deploys.

## 2. Request Flow — Authenticated Page

1. Browser hits `/dashboard`.
2. **Middleware** (`src/middleware.ts`) checks the Better Auth session cookie. No cookie → 302 to `/login?from=/dashboard`.
3. **Dashboard layout** (`app/(dashboard)/layout.tsx`, RSC) calls `auth.api.getSession({ headers: await headers() })`. No session → `redirect("/login")`.
4. Layout calls `githubService.getViewer(userId)` and `listOrgs(userId)` in parallel. Each call:
   - **Cache lookup** (if `CACHE_ENABLED=true`): `cachedFetch` reads `gh:{userId}:viewer:{paramHash}` from Redis.
   - **ETag revalidation**: if a cached envelope exists, sends `If-None-Match: <etag>` to GitHub.
   - GitHub returns `304 Not Modified` → `cachedFetch` returns cached body, refreshes Redis TTL only.
   - GitHub returns `200` → `cachedFetch` writes new envelope `{ body, etag, fetchedAt }` to Redis with the resource's TTL.
   - **Cache off**: `cachedFetch` becomes a pass-through to the fetcher (no Redis read/write).
5. Layout resolves `getActiveContext(userId, viewerLogin)` — reads `active_ctx` cookie, validates it against the user's actual org list (defends against stale cookies after a user leaves an org).
6. Page-level RSCs (`Metrics`, `RecentRepos`) render inside `<Suspense>`. Each fetches via the same cached path.
7. Server-rendered HTML streams to the browser.

## 3. Request Flow — OAuth Sign-In

1. `/login` → button calls `signIn.social({ provider: "github", callbackURL: "/dashboard" })` (better-auth client).
2. Better Auth redirects to `https://github.com/login/oauth/authorize?...` with `OAUTH_SCOPES = [read:user, user:email, repo, read:org, read:packages, read:project]`. The personal Actions billing endpoints additionally require the `user` scope, which is deliberately **not** requested at sign-in — it is granted incrementally, on demand, via the billing CTA (`linkSocial`, see §5b).
3. GitHub redirects to `/api/auth/callback/github` (handled by Better Auth's catch-all `app/api/auth/[...all]/route.ts`).
4. Better Auth's Drizzle adapter writes a row to `account` with the plaintext `accessToken` (unavoidable — it's how the adapter works).
5. **`databaseHooks.account.create.after`** fires synchronously after the insert: encrypts the token via `encryptToJson(...)` and writes `{ encryptedAccessToken, accessToken: null }`. Plaintext column is now empty.
6. Session row written → cookie set → user redirected to `/dashboard`.

For OAuth refresh, `databaseHooks.account.update.after` mirrors the encryption step.

## 4. Token Storage

- **Algorithm**: AES-256-GCM (`lib/auth/encryption.ts`).
- **Key**: 32-byte hex from `TOKEN_ENCRYPTION_KEY`. Validated at every encrypt/decrypt call.
- **IV**: 12 bytes random per write. Stored alongside ciphertext.
- **Auth tag**: stored alongside ciphertext (defends against tampering).
- **Envelope**: JSON `{ ciphertext, iv, authTag }` (all base64), stored as text in `account.encrypted_access_token`.
- **Read path**: `getGithubToken(userId)` looks up the row, falls back to plaintext column if encryption hadn't completed yet (race protection on first request after sign-in).

## 5. GitHub API Layer

```
                ┌──────────────────────────────┐
                │ githubService.{method}       │
                │ (lib/github/service.ts)      │
                └──────────┬───────────────────┘
                           │
                           ▼
                ┌──────────────────────────────┐
                │ cachedFetch<T>               │
                │ (lib/github/cache.ts)        │
                │  • CACHE_ENABLED=false →     │
                │      pass-through            │
                │  • CACHE_ENABLED=true →      │
                │      Redis GET, call fetcher │
                │      with ETag, 304 → cached │
                │      200 → write envelope    │
                └──────────┬───────────────────┘
                           │
                           ▼
                ┌──────────────────────────────┐
                │ etagFetch (REST)             │
                │ + raw gql() (GraphQL)        │
                │ → mapGithubError on throw    │
                └──────────┬───────────────────┘
                           │
                           ▼
                ┌──────────────────────────────┐
                │ getGithubClients(userId)     │
                │  → decrypt token             │
                │  → new Octokit + graphql     │
                │    bound to that token       │
                │  → custom log silences 304s  │
                └──────────────────────────────┘
```

### Cache key shape

```
gh:{userId}:{resource}:{sha256(JSON.stringify(params)).slice(0,16)}
```

### TTL table (`lib/github/cache.ts`)

| Resource | TTL |
|----------|-----|
| viewer | 3600s |
| repos / repo | 300s |
| issues / prs | 120s |
| stars | 600s |
| orgs | 1800s |
| packages | 600s |
| projects | 300s |
| readme | 1800s |
| languages | 3600s |
| releases | 1800s |
| tags | 1800s |
| contributors | 3600s |
| commits | 120s |
| heatmap | 3600s |
| dependencies | 600s |

### Invalidation

- `invalidate(userId, resource)` uses `redis.scanStream({ match: pattern })` and pipelines `DEL` calls. No blocking `KEYS`.
- `resource = "*"` wipes all entries for the user (used by `revokeAccessAction`).
- After `createRepo`, only the `repos` namespace is invalidated.
- When `CACHE_ENABLED=false`, `invalidate` is a no-op.

## 5b. Actions Usage & Billing

The `/actions` page and the dashboard widget surface GitHub Actions usage for the
**active context** (personal account or org). Two independent data sources are
combined:

| Concern | Source | Notes |
|---------|--------|-------|
| Billable minutes, cost, per-OS, per-repo, per-day | `GET /users/{u}/settings/billing/usage` · `GET /organizations/{org}/settings/billing/usage` (enhanced billing platform) | Only **private** repos on GitHub-hosted runners are billed; public repos are free and never appear. |
| Runs, success rate, duration, failures | `rest.actions.listWorkflowRunsForRepo` (via `githubService.listWorkflowRuns`) | Covers public and private repos. |

- **Scope requirement (opt-in)**: personal billing requires the `user` OAuth
  scope (`lib/auth/github-scope-check.ts` → `hasGithubScope`). It is **not** part
  of `GITHUB_OAUTH_SCOPES`, so sign-in never asks for a write-capable scope.
  It is requested only when the user clicks the billing CTA, which calls
  `linkSocial({ provider: "github", scopes: ["user"] })`; Better Auth merges the
  grant into `account.scope` (callback merge, no logout). Org billing requires
  the caller to be an org owner/billing manager; otherwise GitHub returns 403.
- **Included minutes**: not exposed by the API. Mapped from `plan.name`
  (`lib/github/actions-included-minutes.ts`): free/developer 2000, pro/team/business
  3000, enterprise 50000. Unknown plan → `includedMinutes: null` (usage shown without
  a denominator).
- **Aggregation** is pure and unit-tested: `lib/github/actions-billing-parse.ts`
  (filters Actions minute lines tolerantly — product contains "action", unit
  contains "minute" — and groups by OS/repo/day) and
  `lib/github/actions-activity-parse.ts` (success rate, avg duration via
  `updated_at - run_started_at`, workflow rollups, failed runs).
- **Daily trend** is derived directly from the `date` field on each usage item —
  no extra DB table or `day=` requests needed. Activity scanning requests a
  date range (`created=YYYY-MM-DD..YYYY-MM-DD`) and filters on ISO timestamps in
  code, so past-month views never leak later-month runs.
- **Multipliers**: numbers are **raw runner-minutes** as reported by the API
  (`quantity`). GitHub consumes the included allowance at 1×/2×/10× for
  Linux/Windows/macOS, so the "X / included" comparison is an indicator, not an
  exact billable-equivalent. The UI labels this and shows OS buckets separately.
- **Caching**: billing `actions-billing` and activity `actions-activity` are cached
  via `cachedFetch` for 15 min / 10 min respectively; the plan lookup
  (`actions-plan`) for 1 h.
- **Degradation**: `getActionsUsage` never throws — returns a `status` of
  `ok | missing_scope | forbidden_org | unavailable`. `missing_scope` renders a
  "Grant billing access" button (`GrantGithubScopeButton`), which calls Better Auth
  `linkSocial({ provider: "github", callbackURL })` to incrementally grant the `user`
  scope. Plain re-sign-in does **not** refresh stored scopes.
- **Rate-limit budget**: activity scanning is bounded to the top 15 recently pushed
  repos × up to 2 pages, with concurrency 4 (≤ ~30 requests per cold load).

## 6. Multi-User Isolation

- **DB**: `account`, `session`, `user_preferences` keyed by `userId`. Foreign keys cascade on user delete.
- **Cache**: keys prefixed with `userId`. Two users hitting the same endpoint never share envelopes.
- **GitHub clients**: `getGithubClients(userId)` builds a per-call Octokit instance bound to that user's token. No cross-tenant token leakage possible.
- **Active context cookie**: scoped to the browser session. Validated against the user's orgs every page render.

## 7. Build & Runtime (Vercel)

### Build pipeline (`vercel.json` → `pnpm vercel-build`)

1. `pnpm install` (install command).
2. `node scripts/migrate.mjs` — runs Drizzle migrations against `MIGRATION_DATABASE_URL` (Neon **unpooled**). Driver is selected by `DB_DRIVER` (`neon` on Vercel, `node-postgres` locally).
3. `next build` — produces standard Next output (not standalone — Vercel handles bundling).
4. `vercel.json:git.deploymentEnabled.main = true` restricts auto-deploys to the `main` branch.

### Runtime

- Next.js runs on Vercel **Fluid Compute** with the Node.js runtime. No edge runtime in use.
- DB access uses `@neondatabase/serverless` (websocket pool, drop-in compatible with `pg.Pool`). Reused across invocations when the function instance is reused.
- Migrations re-run on every build; they're idempotent thanks to drizzle-orm's `__drizzle_migrations` tracking table.
- `lib/env.ts` returns build-phase placeholders during `next build` so page-data collection never crashes on missing real env vars.

### Health probe

`/api/health` (force-dynamic) executes `SELECT 1` against Postgres. Returns 200 on success; 503 on failure. Wire any uptime monitor here.

## 8. Local Development

```sh
# .env.local — fill in
pnpm install
pnpm db:push          # apply schema directly (no migration files)
pnpm dev              # next dev on :3000
```

Two supported local DB setups:
- **Neon dev branch** (recommended): zero local infra, just `DB_DRIVER=neon` + Neon branch URL.
- **Local Postgres**: any Postgres 16 instance (Docker, Homebrew, etc.), `DB_DRIVER=node-postgres`.

## 9. Environment Variables (validated by `lib/env.ts`)

| Var | Required | Purpose |
|-----|----------|---------|
| `NODE_ENV` | yes | development/production/test |
| `DATABASE_URL` | yes | Postgres connection string (Neon pooled URL on Vercel) |
| `DB_DRIVER` | yes | `neon` (Vercel) or `node-postgres` (local) |
| `MIGRATION_DATABASE_URL` | build-time only | Neon **unpooled** URL — used by `scripts/migrate.mjs` |
| `CACHE_ENABLED` | no | `true` to enable Redis envelope cache; defaults to `true` but Vercel deploys set `false` |
| `REDIS_URL` | only if cache on | Redis connection string |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | yes | OAuth App credentials |
| `TOKEN_ENCRYPTION_KEY` | yes | 64-char hex (32 bytes). Generate: `openssl rand -hex 32` |
| `BETTER_AUTH_SECRET` | yes | Min 32 chars. Generate: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | yes | Public base URL (used for OAuth callback) |
| `RELEASE_WEBHOOK_URL` / `RELEASE_WEBHOOK_SECRET` | optional | Used by `.github/workflows/release.yml` to invalidate `/changelog` cache |

During `next build`, missing values fall back to placeholders so build-time page-data collection never throws. At runtime the schema is enforced and a missing var aborts the request.

## 10. Failure Modes & Mitigations

| Failure | Behavior | Mitigation |
|---------|----------|------------|
| GitHub 401 (token revoked outside our app) | `UnauthorizedError` thrown from service | Page renders empty state. User must re-link via Settings → revoke + sign in again. |
| GitHub 403 with `x-ratelimit-remaining: 0` | `RateLimitError` with `retryAfterSeconds` | Currently surfaces as empty UI. Future: dedicated banner. |
| Redis down (when cache enabled) | `cachedFetch` falls back to direct fetcher (still serves user, just no cache) | Health endpoint only checks DB — Redis is optional. |
| Postgres / Neon down | DB calls throw | Health endpoint flips to 503. Vercel surface the failure; users see error boundary. |
| Neon cold start | First request after idle ~300ms slower | Acceptable for personal use. Paid Neon tier eliminates idle. |
| OAuth race on first request | Plaintext token still present, encrypted column null | `getGithubToken` falls back to `accessToken` plaintext until the hook completes (next request will see encrypted form). |
| Billing endpoint 403 (personal, missing `user` scope) | `getActionsUsage` returns `status: missing_scope` | Widget/page render a "Grant billing access" button that calls `linkSocial` to incrementally grant the scope. |
| Billing endpoint 403 (org, not owner/billing manager) | `status: forbidden_org` | Page shows an explanatory message; no exception. |
| Billing endpoint 404 / plan unknown | `status: unavailable` / `includedMinutes: null` | Usage renders without a denominator. |

## 11. Out-of-Scope Concerns

- Horizontal scaling (Vercel handles instance count; DB is the bottleneck, mitigated by Neon's serverless model).
- Multi-region deployment.
- GitHub App migration (would replace OAuth App + bump rate limit to 15k/h, allow per-repo scope selection). Tracked in post-MVP backlog.
