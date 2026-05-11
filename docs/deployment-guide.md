# Deployment Guide

> How to ship this app from a cold VPS to a working URL. Target: Dokploy on a single VPS.

## 1. Prerequisites

- VPS with Docker + Dokploy installed.
- Domain name pointing at the VPS (e.g. `dev.webkode.cl`).
- A GitHub OAuth App registered at <https://github.com/settings/developers>:
  - **Authorization callback URL**: `https://<your-domain>/api/auth/callback/github`
  - **Homepage URL**: `https://<your-domain>`
- Two secrets generated locally:
  ```sh
  openssl rand -hex 32          # → TOKEN_ENCRYPTION_KEY (64 chars)
  openssl rand -base64 32       # → BETTER_AUTH_SECRET (≥32 chars)
  ```

## 2. Provision Services in Dokploy

Create a project, then add three services in this order:

### 2.1 Postgres 16

- Image: `postgres:16-alpine` (or Dokploy's managed Postgres template).
- Persist `/var/lib/postgresql/data` to a Dokploy volume.
- Note the connection string. Format: `postgres://USER:PASS@HOST:5432/DBNAME`.

### 2.2 Redis 7

- Image: `redis:7-alpine`.
- Set a password via `requirepass` in command args.
- Note the URL. Format: `redis://default:PASS@HOST:6379`.

### 2.3 App (this repo)

- Source: GitHub → this repo, branch `develop` (or `main` once promoted).
- Build type: Dockerfile.
- Port: `3000`.
- Health check path: `/api/health`.

## 3. Environment Variables

Set these in the Dokploy app's environment panel. Anything missing will abort the request at runtime (validated by `lib/env.ts`):

| Var | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Postgres URL from step 2.1 |
| `REDIS_URL` | Redis URL from step 2.2 |
| `GITHUB_CLIENT_ID` | from your OAuth App |
| `GITHUB_CLIENT_SECRET` | from your OAuth App |
| `TOKEN_ENCRYPTION_KEY` | 64-char hex from step 1 |
| `BETTER_AUTH_SECRET` | base64 from step 1 |
| `BETTER_AUTH_URL` | `https://<your-domain>` |

`NEXT_TELEMETRY_DISABLED=1` is set by the Dockerfile.

## 4. Deploy

1. In Dokploy, trigger a build. The multi-stage Dockerfile produces a runner image around 200-300 MB.
2. Wait for the deploy to settle. The container's entrypoint runs `scripts/migrate.mjs` first, then starts `node server.js`. Check logs for:
   ```
   [entrypoint] running migrations...
   [migrate] running migrations...
   [migrate] done
   [entrypoint] starting server...
   ```
3. Probe `https://<your-domain>/api/health`. Expect `{"db":"ok","redis":"ok"}` with status 200.
4. Open `https://<your-domain>/login` and complete the OAuth flow.

## 5. Initial Checks After First Sign-In

1. **Token encryption**: from a Postgres shell run
   ```sql
   SELECT id, "providerId", "accessToken" IS NULL AS plaintext_cleared, "encryptedAccessToken" IS NOT NULL AS has_encrypted FROM account;
   ```
   Both flags should be `true`. If `accessToken` still has a value, the post-create hook didn't fire — check app logs and re-verify `lib/auth/auth.ts:databaseHooks`.
2. **Redis isolation**: `redis-cli --pass <PASS> KEYS 'gh:*'` should show keys prefixed `gh:<userId>:...`. Never bare `gh::...`.
3. **Health endpoint** at `/api/health` returns 200.

## 6. Updating

Push to `develop` (or whichever branch the Dokploy app tracks). Dokploy rebuilds the image and restarts the container. Migrations run automatically on each restart and are idempotent.

For risky migrations:

1. Generate locally: `pnpm db:generate`.
2. Inspect `drizzle/<n>_<name>.sql` and the `drizzle/meta/` snapshot.
3. Test against a disposable DB: `pnpm db:push` against the dev compose stack.
4. Commit + push.

## 7. Local Development Flow

```sh
# One-time
cp .env.example .env.local
# Fill DATABASE_URL=postgres://gitcontrol:gitcontrol_dev@localhost:5433/gitcontrol
#      REDIS_URL=redis://default:gitcontrol_dev@localhost:6379
#      GITHUB_CLIENT_ID/SECRET (use a separate dev OAuth App)
#      TOKEN_ENCRYPTION_KEY (openssl rand -hex 32)
#      BETTER_AUTH_SECRET (openssl rand -base64 32)
#      BETTER_AUTH_URL=http://localhost:3000

docker compose -f docker-compose.dev.yml up -d
pnpm install
pnpm db:push          # syncs schema without producing migration files
pnpm dev              # http://localhost:3000
```

To inspect the DB: `pnpm db:studio` (drizzle-kit web UI).

## 8. Common Failure Modes

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| OAuth callback returns "Invalid environment variables" | One of the env vars is unset/malformed at runtime | Cross-check Dokploy env panel against `lib/env.ts` schema. |
| Sign-in succeeds but dashboard shows zeros | Token wasn't encrypted (or decrypt fails — wrong key) | Verify `TOKEN_ENCRYPTION_KEY` matches what was used at sign-in time. Rotating the key invalidates all stored tokens. |
| Pages crash with `Failed to fetch viewer` | GitHub 401 — token revoked externally | User goes to Settings → Account → Revoke access, then signs in again. |
| Health endpoint returns 503 | DB or Redis unreachable | Check Dokploy service status. Restart if needed. |
| Octokit logs spam during dev | Custom logger silences 304s; another path may be logging raw errors | Inspect `lib/github/client.ts:noopLog`. Don't suppress legitimate errors. |

## 9. Backups (Recommended, Not Built-In)

- **Postgres**: schedule daily `pg_dump` via Dokploy's task runner or a sidecar cron.
- **Redis**: AOF is enabled in `docker-compose.dev.yml`'s example; ensure your prod Redis service does the same. Cache loss is recoverable (just slower first request per resource).

## 10. Rotating Secrets

- **`TOKEN_ENCRYPTION_KEY`**: rotating invalidates every stored encrypted token. All users will need to revoke + re-authorize. No automated migration today.
- **`BETTER_AUTH_SECRET`**: rotating invalidates active sessions. Users must sign in again.
- **GitHub OAuth secret**: rotate via the OAuth App settings. Update Dokploy env. Existing tokens remain valid (they were issued with the old secret but only the secret is needed for the OAuth handshake itself).
