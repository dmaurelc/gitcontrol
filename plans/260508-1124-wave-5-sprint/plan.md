---
status: pending
created: 2026-05-08
project: maureldev-wave-5
branch: develop
---

# Wave 5 Sprint — Plan

Sprint Wave 5 derivado de `plans/reports/scout-260508-1035-devdock-crmdev-ideas.md`. Cada feature = rama propia → PR a `develop`. Release final: PR `develop` → `main`.

## Decisiones de alcance (validadas con usuario)

- ❌ **Multi-tenant scoping**: skipeado. Modelo single-user-per-instancia se mantiene; re-evaluar cuando aparezca caso real de equipo compartido.
- ❌ **Vitest harness**: skipeado. Sin tests automatizados en este sprint.
- ✅ **Cmd+K índice**: solo entidad **repos** (owner/name + descripción).
- ✅ **Dep tracker**: GitHub **Dependency Graph API (GraphQL)** como fuente principal multi-lenguaje + npm registry como fallback para "outdated" en JS/TS.

## Stack & contexto

- Next.js 16.2.5 (App Router, RSC-first) + React 19. **AGENTS.md**: leer `node_modules/next/dist/docs/` antes de Next code.
- Drizzle + Postgres 16 · Better Auth · Redis (cachedFetch + ETags) · shadcn/ui · Tailwind 4 · IBM Plex Mono.
- Reutilizar: `lib/github/cache.ts` (`cachedFetch` + `invalidate`), `lib/github/service.ts`, `userPreferences.filters` jsonb, `userPreferences.defaultView`.
- Restricciones: YAGNI/KISS/DRY · archivos > 200 LOC modularizar · sin mocks/datos falsos.

## Fases (orden de ejecución)

| # | Fase | Esfuerzo | Branch | Estado | Archivo |
|---|------|----------|--------|--------|---------|
| 1 | View mode toggle (grid/list) | S | `feature/view-mode-toggle` | pending | [phase-01-view-mode-toggle.md](phase-01-view-mode-toggle.md) |
| 2 | Sync status indicator | S | `feature/sync-status-indicator` | pending | [phase-02-sync-status-indicator.md](phase-02-sync-status-indicator.md) |
| 3 | Devicon tech-stack badges | S | `feature/devicon-badges` | pending | [phase-03-devicon-badges.md](phase-03-devicon-badges.md) |
| 4 | Health-score badge | M | `feature/repo-health-score` | pending | [phase-04-repo-health-score.md](phase-04-repo-health-score.md) |
| 5 | Cmd+K repos search index | M | `feature/cmdk-repos-index` | pending | [phase-05-cmdk-repos-index.md](phase-05-cmdk-repos-index.md) |
| 6 | Dependency tracker + auto-issue | M-L | `feature/dependency-tracker` | pending | [phase-06-dependency-tracker.md](phase-06-dependency-tracker.md) |

Quick wins primero (#1-3) → mid (#4-5) → más pesado (#6). Cada uno independiente, mergeable individualmente.

## Flujo Git (por fase)

1. `git checkout develop && git pull`
2. `git checkout -b feature/<slug>`
3. Implementar + commits convencionales (`feat:`, `fix:`, `refactor:`, etc.)
4. `git push -u origin feature/<slug>`
5. `gh pr create --base develop` → review → merge (squash)
6. Repetir para siguiente fase

Al cerrar las 6 fases en `develop`: PR `develop` → `main` (merge commit) → Dokploy redeploy producción.

## Dependencias entre fases

- **#1 view mode** edita `userPreferences.filters` (jsonb) — sienta patrón para futuros toggles.
- **#2 sync status** lee `fetchedAt` desde envelope cache existente — sin schema change.
- **#3 devicon badges** consume languages ya cacheados — sin dep extra.
- **#4 health score** lee múltiples endpoints ya cacheados (commits, PRs, issues, runs) — agrega cómputo + nuevo cache key derivado.
- **#5 cmdk index** depende solo de `listRepos` — sin dep en otras fases. Reusable para futuras entidades.
- **#6 dep tracker** usa GraphQL `dependencyGraphManifests` + `getContent` existente para fallback. Independiente.

Sin bloqueos cruzados. Pueden ejecutarse en orden propuesto u otro si conviene.

## Documentación al cierre

Al final de cada fase:
- Actualizar `docs/project-roadmap.md` (mover fase a "Completed Wave 5").
- Actualizar `docs/codebase-summary.md` si agrega rutas/módulos nuevos.

Al cierre de Wave 5: entrada en `docs/project-changelog.md` (crearlo si no existe).

## Open Questions (sprint-level)

1. **Telemetría** — ninguna fase incluye métricas. ¿Esperamos al siguiente sprint para Prometheus o instrumentamos cmdk/dep-tracker desde ya?
2. **Rate limiting MCP/API keys** — scout sugiere prerequisito antes de exponer endpoints externos. Wave 5 no expone API públicas, pero dep-tracker llama npm registry desde server — ¿throttle?
3. **Branch staging Dokploy** — actualmente `develop` es staging y `main` es prod. ¿Mantener ese mapping o usar `feature/*` previews? Si `develop` deploya, cada PR mergeado se publica a staging automáticamente.
