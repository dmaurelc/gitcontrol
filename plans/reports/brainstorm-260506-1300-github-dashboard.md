# Brainstorm: GitHub Dashboard Multi-Usuario

## Problem Statement
Construir dashboard self-hosted para gestionar cuenta GitHub (repos, issues, PRs, stars, projects, packages) más rápido y ordenado que la web oficial. Multi-usuario: cada usuario accede solo a sus datos + orgs donde es miembro.

## Decisions (User-Approved)
- **Stack**: Next.js 16 (latest stable) + TypeScript + Tailwind v4 + shadcn/ui
- **Auth**: Better Auth + GitHub OAuth (scopes: read:user, repo, read:org, read:packages, read:project)
- **DB**: Postgres + Drizzle ORM
- **Cache**: Redis (Octokit responses, ETag revalidation)
- **GitHub Client**: Octokit (REST + GraphQL para Projects v2)
- **Deploy**: Dokploy self-hosted (VPS)
- **Multi-user**: usuarios independientes + soporte de orgs GitHub vía OAuth
- **Scope**: MVP enfocado (read-mostly + crear repo); mutaciones avanzadas en fase 2

## Architecture Summary
- App Router RSC + Server Actions
- GitHubService server-only: Octokit instance per request usando access token cifrado del user
- Redis cache key: `user:{id}:resource:{hash}`; TTLs: profile 1h, repos 5min, issues/PRs 2min
- Tokens AES-256-GCM en DB; aislamiento por session.userId en toda query
- Org switcher: contexto activo (user o org) para todas las vistas

## Data Model (mínimo)
- user, account (token cifrado), session (Better Auth)
- user_preferences: theme, defaultView, pinnedRepos, filters
- cache_meta (opcional): etag tracking

## Routes (MVP)
/login · /dashboard · /repositories · /repositories/[owner]/[repo]/(issues|pulls) · /stars · /projects · /packages · /orgs/[org] · /settings

## Phases
1. Setup (Next.js 16, Dokploy, Postgres, Redis, Drizzle)
2. Auth (Better Auth + GitHub OAuth + token encryption)
3. GitHubService (Octokit + Redis cache + ETags)
4. Overview + Org switcher
5. Repositorios (lista + filtros + detalle + issues/PRs)
6. Stars + Projects + Packages
7. Settings + preferencias usuario

## Risks
- GitHub rate limit 5k/h (mitigado con Redis + ETags; escalar a GitHub App si crece)
- Tokens en DB requieren rotación/monitoring
- Next.js 16 reciente: posibles edge cases en libs

## Success Criteria
- Login GitHub OAuth funcional con multi-user aislado
- Lista de repos filtrable carga <500ms (cache hit)
- Cambio de contexto user↔org sin recargar app
- Crear repo desde UI funciona
- Vistas read-only de issues/PRs por repo

## Next Step
Invocar /ck:bootstrap para generar plan por fases en plans/260506-1300-github-dashboard/
