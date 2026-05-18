# Deployment Guide

> Ship GitControl from zero to a working URL. Target stack: **Vercel + Neon Postgres**. Free tiers are enough for personal use.

## 1. Prerequisites

- A [Vercel](https://vercel.com) account (Hobby plan is fine).
- A [Neon](https://neon.tech) account (free tier is fine).
- A fork of this repo on GitHub (so Vercel can wire up auto-deploys).
- A GitHub OAuth App registered at <https://github.com/settings/developers>:
  - **Homepage URL**: `https://<your-domain>` (use the `*.vercel.app` URL Vercel hands you).
  - **Authorization callback URL**: `https://<your-domain>/api/auth/callback/github`
- Two secrets generated locally:
  ```sh
  openssl rand -hex 32          # → TOKEN_ENCRYPTION_KEY (64 hex chars)
  openssl rand -base64 32       # → BETTER_AUTH_SECRET   (≥32 chars)
  ```

## 2. Provision Neon

1. Create a new Neon project. Region close to your Vercel region (e.g. `aws-us-east-1`).
2. From the project dashboard grab **two** connection strings:
   - **Pooled** — used at runtime. Looks like `postgres://USER:PASS@ep-xxx-pooler.<region>.aws.neon.tech/neondb?sslmode=require`.
   - **Unpooled** — used by migrations. Same URL without `-pooler`.
3. No schema setup needed — Drizzle migrations run automatically on every Vercel build (see `scripts/migrate.mjs`).

## 3. Import the Project on Vercel

1. **Add New → Project → Import** your forked repo.
2. Framework preset: **Next.js** (auto-detected, also pinned in `vercel.json`).
3. Build command: leave default — `vercel.json` overrides to `pnpm vercel-build` (runs migrations then `next build`).
4. Install command: `pnpm install`.
5. Don't deploy yet — finish env vars first (step 4).

## 4. Environment Variables

Set these in **Project Settings → Environment Variables** (Production + Preview). Validated by `lib/env.ts`; anything missing aborts the request at runtime.

| Var | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DB_DRIVER` | `neon` |
| `DATABASE_URL` | Neon **pooled** URL (runtime queries) |
| `MIGRATION_DATABASE_URL` | Neon **unpooled** URL (DDL during build) |
| `CACHE_ENABLED` | `false` (Vercel deploys skip Redis by default) |
| `GITHUB_CLIENT_ID` | from your OAuth App |
| `GITHUB_CLIENT_SECRET` | from your OAuth App |
| `TOKEN_ENCRYPTION_KEY` | 64-hex from step 1 |
| `BETTER_AUTH_SECRET` | base64 from step 1 |
| `BETTER_AUTH_URL` | `https://<your-vercel-url>` |

> The pooled URL is required for serverless invocations — `@neondatabase/serverless` uses websocket pooling so TCP pools don't persist between function calls. The unpooled URL is needed only for migrations because Neon's pooler doesn't allow some DDL operations.

### Optional (release workflow)

| Var | Purpose |
|-----|---------|
| `RELEASE_WEBHOOK_URL` | Invalidates `/changelog` cache when a GitHub Release is published |
| `RELEASE_WEBHOOK_SECRET` | Shared secret for the webhook |

## 5. Deploy

1. Click **Deploy** in Vercel.
2. The build runs `pnpm vercel-build` → `node scripts/migrate.mjs` (applies Drizzle migrations against Neon) → `next build`.
3. Watch the build log for:
   ```
   [migrate] running migrations (driver=neon)...
   [migrate] done
   ```
4. Once green, probe `https://<your-vercel-url>/api/health`. Expect `{"db":"ok"}` with status 200.
5. Open `https://<your-vercel-url>/` and complete the OAuth flow.

`vercel.json` restricts auto-deploys to the `main` branch (`git.deploymentEnabled.main: true`). Other branches won't deploy unless you change that.

## 6. Initial Checks After First Sign-In

1. **Token encryption**: from the Neon SQL editor run
   ```sql
   SELECT id, "providerId",
          "accessToken" IS NULL              AS plaintext_cleared,
          "encryptedAccessToken" IS NOT NULL AS has_encrypted
   FROM account;
   ```
   Both flags should be `true`. If `accessToken` still has a value, the post-create hook didn't fire — check the function logs and re-verify `lib/auth/auth.ts:databaseHooks`.
2. **Health endpoint** at `/api/health` returns 200.

## 7. Updating

Push to `main` (or merge a PR into it). Vercel rebuilds and runs migrations automatically. Migrations are idempotent — `drizzle-orm` tracks applied entries in `__drizzle_migrations`.

For risky migrations:

1. Generate locally: `pnpm db:generate`.
2. Inspect `drizzle/<n>_<name>.sql` and `drizzle/meta/`.
3. Test against a Neon branch: `pnpm db:push` with the branch URL.
4. Commit + push.

## 8. Local Development

```sh
# One-time
cp .env.example .env.local
# Fill DATABASE_URL=<neon dev branch URL or local Postgres>
#      DB_DRIVER=neon   (or node-postgres if running local Postgres)
#      CACHE_ENABLED=false
#      GITHUB_CLIENT_ID/SECRET (use a separate dev OAuth App)
#      TOKEN_ENCRYPTION_KEY (openssl rand -hex 32)
#      BETTER_AUTH_SECRET (openssl rand -base64 32)
#      BETTER_AUTH_URL=http://localhost:3000

pnpm install
pnpm db:push          # syncs schema without producing migration files
pnpm dev              # http://localhost:3000
```

Inspect the DB: `pnpm db:studio` (drizzle-kit web UI).

> Tip: use a **Neon branch** for dev. It's a copy-on-write fork of your prod database — zero-cost, isolated, deletable when done.

## 9. Common Failure Modes

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| OAuth callback returns "Invalid environment variables" | One env var is unset/malformed at runtime | Cross-check Vercel env panel against `lib/env.ts` schema. Redeploy after edits. |
| Sign-in succeeds but dashboard shows zeros | Token wasn't encrypted (or decrypt fails — wrong key) | Verify `TOKEN_ENCRYPTION_KEY` matches what was used at sign-in time. Rotating the key invalidates all stored tokens. |
| Pages crash with `Failed to fetch viewer` | GitHub 401 — token revoked externally | User: Settings → Account → Revoke access, then sign in again. |
| `/api/health` returns 503 | Neon unreachable / connection string wrong | Check `DATABASE_URL`. If the Neon project was paused, the first request wakes it (cold start ~300ms). |
| Build fails at `[migrate]` step | `MIGRATION_DATABASE_URL` missing or pointing at the pooler | Use the **unpooled** Neon URL for migrations. |

## 10. Backups & Branching

- **Backups**: Neon retains point-in-time recovery on the free tier (7 days). For longer retention upgrade the Neon plan or schedule a `pg_dump` via Vercel Cron.
- **Branching**: Neon's copy-on-write branches double as instant backups — branch off `main` before risky migrations, swap if anything goes wrong.

## 11. Rotating Secrets

- **`TOKEN_ENCRYPTION_KEY`**: rotating invalidates every stored encrypted token. All users will need to revoke + re-authorize. No automated migration.
- **`BETTER_AUTH_SECRET`**: rotating invalidates active sessions. Users must sign in again.
- **GitHub OAuth secret**: rotate in the OAuth App settings → update Vercel env → redeploy. Existing user tokens remain valid (the secret is only needed for the OAuth handshake itself).

## 12. Custom Domain (Optional)

1. Vercel **Project → Settings → Domains** → add your domain.
2. Point the DNS record per Vercel's instructions.
3. Update **`BETTER_AUTH_URL`** to the new domain.
4. Update the GitHub OAuth App's callback URL + homepage URL to the new domain.
5. Redeploy.
