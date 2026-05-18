# GitControl

A self-hosted, private alternative to the GitHub dashboard. A clean, faster view of your repos, issues, PRs, stars and projects — running on your own Vercel + Neon stack.

**Live demo:** [https://gitcontrol-dev.vercel.app](https://gitcontrol-dev.vercel.app)

## Highlights

- **GitHub OAuth** with AES-256-GCM encrypted tokens at rest
- **Multi-context** — switch between your personal account and any organization without leaving the app
- **Dashboard** — quick metrics, 365-day contribution heatmap, 28-day activity, recent repos
- **Repositories** — list, search, filter by language/visibility, pin favorites, create new
- **Repo detail tabs** — overview, issues, pulls, files (browser + preview), insights, commits, dependencies
- **Cross-repo views** — aggregated issues and PRs across every repo you can see
- **Stars, Projects v2, Packages, Actions, Notifications** — first-class pages, not buried in menus
- **In-app PR merge**, comments, bug-report form, auto-generated changelog
- **Privacy first** — your data and OAuth credentials live in your own Vercel + Neon project

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 + shadcn/ui · Better Auth · Drizzle ORM · Postgres (Neon) · Octokit REST + GraphQL · pnpm.

## Deploy your own

GitControl runs on **Vercel + Neon** (free tiers are enough for personal use). See [docs/deployment-guide.md](./docs/deployment-guide.md) for the full walkthrough.

## Documentation

- [Project overview](./docs/project-overview-pdr.md)
- [Deployment guide](./docs/deployment-guide.md)
- [System architecture](./docs/system-architecture.md)
- [Codebase structure](./docs/codebase-summary.md)
- [Git workflow](./docs/git-workflow.md)

## Status

**v0.11.0 shipped** (May 2026). Core features stable, post-MVP improvements ongoing.

## License

Private. Self-hosting only — not a SaaS.
