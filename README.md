# GitControl

A self-hosted, private alternative to the GitHub dashboard. A clean, faster view of your repos, issues, PRs, stars and projects — running on your own Vercel + Neon stack (or any Docker host).

**Live demo:** [https://gitcontrol.dev](https://gitcontrol.dev)

## Highlights

- **GitHub OAuth** with AES-256-GCM encrypted tokens at rest. Sign-in requests only the scopes the dashboard needs; the `user` scope required for Actions billing is opt-in and granted only when you click the billing CTA.
- **Multi-context** — switch between your personal account and any organization without leaving the app
- **Dashboard** — quick metrics, 365-day contribution heatmap, 28-day activity, recent repos
- **Repositories** — list, search, filter by language/visibility, pin favorites, create new
- **Repo detail tabs** — overview, issues, pulls, files (browser + preview), commits, insights, actions, dependencies
- **Cross-repo views** — aggregated issues and PRs across every repo you can see
- **Stars, Projects v2, Packages, Actions, Notifications** — first-class pages, not buried in menus
- **Actions usage & billing** — monthly minutes vs. included quota, net cost, per-OS and per-repo breakdown, with a daily trend
- **In-app PR merge**, comments, bug-report form, auto-generated changelog
- **Privacy first** — your data and OAuth credentials live in your own infrastructure; the only outbound calls go to `api.github.com`

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 + shadcn/ui · Better Auth · Drizzle ORM · Postgres (Neon or any Postgres 16) · optional Redis cache · Octokit REST + GraphQL · pnpm.

## Requirements

| What | Notes |
|------|-------|
| Node.js 22+ | Matches the Dockerfile (`node:22-alpine`) |
| pnpm 10 | `corepack enable` is enough |
| Postgres 16 | Neon for Vercel, or the bundled Docker Compose for local dev |
| Redis 7 | Optional. Only needed when `CACHE_ENABLED=true` |
| GitHub OAuth App | Created at <https://github.com/settings/developers> |

## Run locally

1. **Clone and install**

   ```bash
   git clone https://github.com/dmaurelc/gitcontrol.git
   cd gitcontrol
   pnpm install
   ```

2. **Create a GitHub OAuth App** with:
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

   Keep the Client ID and generate a Client Secret.

3. **Start Postgres (and Redis)** with the bundled Compose file:

   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

   Postgres listens on `localhost:5433`, Redis on `localhost:6379`.

4. **Configure the environment**

   ```bash
   cp .env.example .env
   openssl rand -hex 32      # → TOKEN_ENCRYPTION_KEY
   openssl rand -base64 32   # → BETTER_AUTH_SECRET
   ```

   Fill `.env` for the Compose services above (it must be `.env`, not `.env.local`: `drizzle-kit` only reads `.env`):

   ```env
   DATABASE_URL=postgres://gitcontrol:gitcontrol_dev@localhost:5433/gitcontrol
   DB_DRIVER=node-postgres
   CACHE_ENABLED=true
   REDIS_URL=redis://:gitcontrol_dev@localhost:6379
   GITHUB_CLIENT_ID=<your client id>
   GITHUB_CLIENT_SECRET=<your client secret>
   TOKEN_ENCRYPTION_KEY=<64 hex chars>
   BETTER_AUTH_SECRET=<32+ chars>
   BETTER_AUTH_URL=http://localhost:3000
   ```

   To skip Redis, set `CACHE_ENABLED=false` and leave `REDIS_URL` empty.

5. **Apply the database migrations and start the app**

   ```bash
   pnpm db:migrate
   pnpm dev
   ```

   Open <http://localhost:3000> and sign in with GitHub.

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | yes | Postgres connection string (pooled URL on Neon) |
| `DB_DRIVER` | no | `node-postgres` (default, local/Docker) or `neon` (Vercel + Neon) |
| `MIGRATION_DATABASE_URL` | Vercel only | Unpooled Neon URL used by `scripts/migrate.mjs` during build |
| `CACHE_ENABLED` | no | `true` (default) needs `REDIS_URL`; `false` disables caching |
| `REDIS_URL` | if cache on | Redis connection string |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | yes | GitHub OAuth App credentials |
| `TOKEN_ENCRYPTION_KEY` | yes | 64 hex chars (32 bytes) for AES-256-GCM |
| `BETTER_AUTH_SECRET` | yes | Session signing secret, 32+ chars |
| `BETTER_AUTH_URL` | yes | Public base URL of the app |
| `RELEASE_WEBHOOK_URL` / `RELEASE_WEBHOOK_SECRET` | no | Used by the release workflow to refresh the `/changelog` cache |

### Scripts

| Command | Does |
|---------|------|
| `pnpm dev` | Dev server on port 3000 |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm lint` / `pnpm typecheck` | ESLint and TypeScript checks |
| `pnpm test` | Unit tests (`node --test`) |
| `pnpm db:generate` | Generate a migration from schema changes |
| `pnpm db:migrate` / `pnpm db:push` / `pnpm db:studio` | Apply migrations, push schema, open Drizzle Studio |

## GitHub permissions

Sign-in requests `read:user`, `user:email`, `repo`, `read:org`, `read:packages` and `read:project`. The `repo` scope is what GitHub requires to read private repositories, and it also covers the in-app actions (creating repos, filing issues, merging PRs). Actions billing needs the extra `user` scope; GitControl asks for it only when you opt in from the Actions page.

## Deploy your own

GitControl runs on **Vercel + Neon** (free tiers are enough for personal use). See [docs/deployment-guide.md](./docs/deployment-guide.md) for the full walkthrough. A `Dockerfile` is also included for self-hosting on a VPS (for example with Dokploy).

## Documentation

- [Project overview](./docs/project-overview-pdr.md)
- [Deployment guide](./docs/deployment-guide.md)
- [System architecture](./docs/system-architecture.md)
- [Codebase structure](./docs/codebase-summary.md)
- [Git workflow](./docs/git-workflow.md)

## Status

Actively maintained. See [Releases](https://github.com/dmaurelc/gitcontrol/releases) for the latest version and changelog.

## License

Private. Self-hosting only — not a SaaS.
