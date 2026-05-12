# System Architecture

> How the pieces fit together. Updated 2026-05-12. GitControl v0.9.2.

## 1. High-Level Topology

```
┌─────────────┐    HTTPS    ┌──────────────────────────────────┐
│   Browser   │◀───────────▶│  Next.js 16 (standalone, port 3000)│
└─────────────┘             │  • RSC pages + server actions    │
                            │  • Edge middleware (auth guard)  │
                            │  • API routes (auth, health)     │
                            └──────┬──────────────┬────────────┘
                                   │              │
                          better-auth│             │ Octokit
                          adapter   │              │ REST + GraphQL
                                   ▼              ▼
                            ┌────────────┐  ┌────────────┐
                            │ Postgres 16│  │ github.com │
                            │ (Drizzle)  │  └─────┬──────┘
                            └────────────┘        │
                                                  │ ETag-aware
                                   ┌──────────────┘
                                   ▼
                            ┌────────────┐
                            │  Redis 7   │
                            │ (ioredis)  │
                            └────────────┘
```

All four containers run on a Dokploy-managed VPS. Postgres + Redis are Dokploy-managed services; the Next app is built from this repo's `Dockerfile`.

## 2. Request Flow — Authenticated Page

1. Browser hits `/dashboard`.
2. **Edge middleware** (`src/middleware.ts`) checks the Better Auth session cookie. No cookie → 302 to `/login?from=/dashboard`.
3. **Dashboard layout** (`app/(dashboard)/layout.tsx`, RSC) calls `auth.api.getSession({ headers: await headers() })`. No session → `redirect("/login")`.
4. Layout calls `githubService.getViewer(userId)` and `listOrgs(userId)` in parallel. Each call:
   - **Cache lookup**: `cachedFetch` reads `gh:{userId}:viewer:{paramHash}` from Redis.
   - **ETag revalidation**: if a cached envelope exists, sends `If-None-Match: <etag>` to GitHub.
   - GitHub returns `304 Not Modified` → `cachedFetch` returns cached body, refreshes Redis TTL only.
   - GitHub returns `200` → `cachedFetch` writes new envelope `{ body, etag, fetchedAt }` to Redis with the resource's TTL.
5. Layout resolves `getActiveContext(userId, viewerLogin)` — reads `active_ctx` cookie, validates it against the user's actual org list (defends against stale cookies after a user leaves an org).
6. Page-level RSCs (`Metrics`, `RecentRepos`) render inside `<Suspense>`. Each fetches via the same cached path.
7. Server-rendered HTML streams to the browser.

## 3. Request Flow — OAuth Sign-In

1. `/login` → button calls `signIn.social({ provider: "github", callbackURL: "/dashboard" })` (better-auth client).
2. Better Auth redirects to `https://github.com/login/oauth/authorize?...` with `OAUTH_SCOPES = [read:user, user:email, repo, read:org, read:packages, read:project]`.
3. GitHub redirects to `/api/auth/callback/github` (handled by Better Auth's catch-all `app/api/auth/[...all]/route.ts`).
4. Better Auth's Drizzle adapter writes a row to `account` with the plaintext `accessToken` (this is unavoidable — it's how the adapter works).
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
                │  • Redis GET                 │
                │  • Calls fetcher with ETag   │
                │  • 304 → return cached       │
                │  • 200 → write envelope      │
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

## 6. Multi-User Isolation

- **DB**: `account`, `session`, `user_preferences` keyed by `userId`. Foreign keys cascade on user delete.
- **Cache**: keys prefixed with `userId`. Two users hitting the same endpoint never share envelopes.
- **GitHub clients**: `getGithubClients(userId)` builds a per-call Octokit instance bound to that user's token. No cross-tenant token leakage possible.
- **Active context cookie**: scoped to the browser session. Validated against the user's orgs every page render.

## 7. Build & Runtime

### Build (Docker multi-stage, see `Dockerfile`)

1. **deps**: `pnpm install --frozen-lockfile`.
2. **builder**: `pnpm build` (Next.js → standalone output). `NEXT_PHASE=phase-production-build` triggers env placeholder fallback in `lib/env.ts:42-46`, so missing real env vars don't crash page-data collection.
3. **migrator**: separate stage that creates a self-contained `npm` tree with `drizzle-orm@0.45.2` + `pg@8.20.0` + `migrate.mjs`. Lives in `/app/migrator` so Node's ESM resolver finds those packages without bundling.
4. **runner**: assembles `.next/standalone` + `public` + static + drizzle migrations + migrator. Runs as non-root `nextjs:1001`. CMD: `sh scripts/entrypoint.sh`.

### Runtime startup (`scripts/entrypoint.sh`)

```sh
1. cd /app/migrator && MIGRATIONS_FOLDER=/app/drizzle node migrate.mjs
2. exec node server.js   # Next standalone server on :3000
```

Migrations run on every container start. They are idempotent (drizzle-orm tracks applied migrations in a `__drizzle_migrations` table).

### Health probe

`/api/health` (force-dynamic) executes `SELECT 1` against Postgres + `PING` against Redis. Returns 200 only when both succeed; 503 otherwise. Wired to Dokploy's HTTP health check.

## 8. Local Development

```sh
docker compose -f docker-compose.dev.yml up -d   # Postgres :5433, Redis :6379
pnpm install
pnpm db:push                                      # apply schema
pnpm dev                                          # next dev on :3000
```

`docker-compose.dev.yml` provisions:
- Postgres 16 (`gitcontrol/gitcontrol_dev`) on host port `5433` to avoid colliding with system Postgres.
- Redis 7 with `requirepass gitcontrol_dev`.

## 9. Environment Variables (validated by `lib/env.ts`)

| Var | Purpose |
|-----|---------|
| `NODE_ENV` | development/production/test |
| `DATABASE_URL` | Postgres connection string |
| `REDIS_URL` | Redis connection string |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | OAuth App credentials |
| `TOKEN_ENCRYPTION_KEY` | 64-char hex (32 bytes). Generate: `openssl rand -hex 32` |
| `BETTER_AUTH_SECRET` | Min 32 chars. Generate: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Public base URL (used for OAuth callback) |

During `next build`, missing values fall back to placeholders so build-time page-data collection never throws. At runtime, the schema is enforced and a missing var aborts the request.

## 10. Failure Modes & Mitigations

| Failure | Behavior | Mitigation |
|---------|----------|------------|
| GitHub 401 (token revoked outside our app) | `UnauthorizedError` thrown from service | Page renders empty state. User must re-link via Settings → revoke + sign in again. |
| GitHub 403 with `x-ratelimit-remaining: 0` | `RateLimitError` with `retryAfterSeconds` | Currently surfaces as empty UI. Future: dedicated banner. |
| Redis down | `getRedis()` logs error; `cachedFetch` throws on `get` | Health endpoint flips to 503. Pages crash. Acceptable for self-hosted single-VPS deploy; HA out of scope. |
| Postgres down | DB calls throw | Health endpoint flips to 503. Same as above. |
| OAuth race on first request | Plaintext token still present, encrypted column null | `getGithubToken` falls back to `accessToken` plaintext until the hook completes (next request will see encrypted form). |

## 11. Out-of-Scope Concerns

- Horizontal scaling (assumes single Next instance — Redis-based session would be needed otherwise; Better Auth defaults to DB sessions which already work).
- Multi-region deployment.
- GitHub App migration (would replace OAuth App + bump rate limit to 15k/h, allow per-repo scope selection). Tracked in post-MVP backlog.
