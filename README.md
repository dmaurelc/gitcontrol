# MaurelDev — Self-Hosted GitHub Dashboard

Multi-user dashboard for managing your GitHub account: repos, issues, PRs, stars, projects, and packages. Self-hosted on Dokploy with per-user OAuth and AES-256-GCM token encryption.

> **Status**: MVP shipped (phases 1-7). Live at `https://dev.webkode.cl`. Post-MVP improvements pending.

## Stack

Next.js 16 (App Router, RSC, server actions) · TypeScript · Tailwind v4 · shadcn/ui (new-york) · Better Auth · Postgres 16 + Drizzle ORM · Redis 7 (`ioredis`) · Octokit REST + GraphQL · pnpm 10 · Docker (multi-stage) · Dokploy.

## Features (MVP)

- **Auth**: GitHub OAuth via Better Auth. Access token encrypted at rest (AES-256-GCM).
- **Context switcher**: toggle between personal account and any org you belong to.
- **Overview**: metrics (repos, stars, open PRs, open issues) + recently updated repos.
- **Repositories**: list with filters (search, language, visibility, sort), pin/unpin, paginated. Detail tabs: overview, issues, pulls. Create new repo dialog (Zod-validated).
- **Stars**: paginated starred repos with `starred_at`.
- **Projects v2**: GraphQL-backed listing.
- **Packages**: list by type (container, npm, maven, rubygems, nuget) with permission-error guidance.
- **Settings**: theme (light/dark/system), pinned repos, GitHub access revocation.

## Architecture Highlights

- **Per-user GitHub cache** in Redis with ETag revalidation. Cache key: `gh:{userId}:{resource}:{paramHash}`.
- **Lazy DB / Auth / Redis proxies** so `next build`'s page-data collection never crashes on missing env vars (`src/lib/env.ts` returns placeholders during the build phase only).
- **Token encryption hook**: Better Auth's `databaseHooks.account.{create,update}.after` re-encrypts the OAuth access token immediately after the adapter writes it, then nulls the plaintext column.
- **Edge middleware** (`src/middleware.ts`) gates all protected route prefixes via `better-auth/cookies.getSessionCookie`.

## Local Development

Prereqs: Docker, pnpm 10, Node 22+.

```sh
docker compose -f docker-compose.dev.yml up -d   # Postgres :5433, Redis :6379

cp .env.example .env.local
# Fill DATABASE_URL, REDIS_URL, GITHUB_CLIENT_ID/SECRET,
#      TOKEN_ENCRYPTION_KEY (openssl rand -hex 32),
#      BETTER_AUTH_SECRET (openssl rand -base64 32),
#      BETTER_AUTH_URL=http://localhost:3000

pnpm install
pnpm db:push     # apply schema to local Postgres
pnpm dev         # http://localhost:3000
```

Other scripts:

| Script | Purpose |
|--------|---------|
| `pnpm build` | Next standalone production build |
| `pnpm start` | Run the standalone build |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |
| `pnpm db:generate` | Generate a new SQL migration from `schema.ts` |
| `pnpm db:migrate` | Apply migrations (used by Docker entrypoint, not usually run locally) |
| `pnpm db:push` | Push schema directly (dev only) |
| `pnpm db:studio` | Drizzle Studio web UI |

## Deployment

See [docs/deployment-guide.md](./docs/deployment-guide.md). TL;DR: register a GitHub OAuth App, provision Postgres + Redis on Dokploy, set 8 env vars, point the Dokploy app at this repo. Dockerfile is multi-stage (deps → builder → migrator → runner) and the entrypoint runs `drizzle-orm` migrations on every container start.

## Repository Layout

```
src/
├── middleware.ts                # auth guard
├── app/
│   ├── (dashboard)/             # authenticated shell
│   ├── login/                   # GitHub sign-in
│   ├── actions/                 # "use server" actions
│   └── api/                     # better-auth catch-all + health + dev-only debug
├── components/                  # ui/ (shadcn) + theme provider/toggle
└── lib/
    ├── env.ts                   # Zod env + build-phase placeholder
    ├── db/                      # Drizzle client + schema
    ├── auth/                    # Better Auth + AES-256-GCM encryption
    ├── github/                  # Octokit clients + cached service + errors
    ├── redis/                   # ioredis singleton
    ├── context/                 # active org/user cookie
    └── preferences/             # user_preferences accessors
drizzle/                         # auto-generated SQL migrations
scripts/                         # entrypoint.sh + migrate.mjs (run inside container)
plans/                           # phased plans + reports (MVP + post-MVP)
docs/                            # this documentation set
```

## Documentation

| File | Purpose |
|------|---------|
| [docs/project-overview-pdr.md](./docs/project-overview-pdr.md) | Vision, problem, requirements, stack rationale, out-of-scope. |
| [docs/codebase-summary.md](./docs/codebase-summary.md) | Module-by-module map of `src/`. |
| [docs/system-architecture.md](./docs/system-architecture.md) | Request flows, cache layer, build/runtime. |
| [docs/code-standards.md](./docs/code-standards.md) | Conventions for naming, server/client boundary, errors, validation. |
| [docs/design-guidelines.md](./docs/design-guidelines.md) | UI tokens, component usage, loading/empty states. |
| [docs/deployment-guide.md](./docs/deployment-guide.md) | Dokploy provisioning + env vars + post-deploy checks. |
| [docs/project-roadmap.md](./docs/project-roadmap.md) | Completed milestones + active post-MVP phases + backlog. |

## Important Notes

- Next.js 16 has breaking changes from earlier versions. Always read `node_modules/next/dist/docs/` before changing route handlers, `headers()`/`cookies()`, or `searchParams` (which is now a `Promise`).
- The OAuth `accessToken` MUST never be returned over the wire. Only `getGithubToken(userId)` (in `lib/auth/get-github-token.ts`) reads it. Don't query `account` directly.
- Adding a new top-level protected segment? Append its prefix to `PROTECTED_PREFIXES` in `src/middleware.ts`.

## License

Private. Self-host only — not intended for SaaS distribution.
