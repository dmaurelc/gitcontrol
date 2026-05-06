---
status: pending
created: 2026-05-06
project: github-dashboard
---

# GitHub Dashboard Multi-Usuario — Plan

Dashboard self-hosted para gestionar cuenta GitHub (repos, issues, PRs, stars, projects, packages). Multi-usuario con OAuth GitHub. MVP read-mostly + crear repo.

## Stack
Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui · Better Auth · Postgres + Drizzle · Redis · Octokit · Dokploy

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Setup base (Next.js 16, DB, Redis, Drizzle, Dokploy) | pending | [phase-01-setup.md](phase-01-setup.md) |
| 2 | Auth (Better Auth + GitHub OAuth + token encryption) | pending | [phase-02-auth.md](phase-02-auth.md) |
| 3 | GitHubService (Octokit + Redis cache + ETags) | pending | [phase-03-github-service.md](phase-03-github-service.md) |
| 4 | Overview + Org switcher | pending | [phase-04-overview-org-switcher.md](phase-04-overview-org-switcher.md) |
| 5 | Repositorios (lista, filtros, detalle, issues/PRs, crear repo) | pending | [phase-05-repositories.md](phase-05-repositories.md) |
| 6 | Stars + Projects (GraphQL) + Packages | pending | [phase-06-stars-projects-packages.md](phase-06-stars-projects-packages.md) |
| 7 | Settings + preferencias usuario | pending | [phase-07-settings.md](phase-07-settings.md) |

## Key Dependencies
- GitHub OAuth App (client_id, client_secret) creada por usuario
- VPS con Dokploy operativo (Postgres + Redis services)
- Encryption key 32 bytes (env: `TOKEN_ENCRYPTION_KEY`)

## Source Brainstorm
[brainstorm-260506-1300-github-dashboard.md](../reports/brainstorm-260506-1300-github-dashboard.md)

## Build Order
Phases secuenciales 1→7. Phase 3 (GitHubService) habilita 4-7. Phases 5-7 podrían paralelizarse si se quiere acelerar luego de phase 4.
