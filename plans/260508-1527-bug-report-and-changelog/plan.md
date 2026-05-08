---
status: completed
created: 2026-05-08
completed: 2026-05-08
project: maureldev-bug-report-changelog
branch: develop
progress: 2/2
blockedBy: []
blocks: []
---

# Bug Report + Public Changelog — Plan

Dos features independientes pero relacionadas (ambas tocan repo principal vía GitHub API). Cada feature = rama propia → PR a `develop`. No bloquean entre sí; pueden ejecutarse en paralelo o secuencial.

## Decisiones validadas (usuario)

- ✅ **Repo destino bugs**: `dmaurelc/maureldev` hardcoded vía constante (`OWNER_REPO`). Privado por ahora; cuando se abra al público no requiere cambios.
- ✅ **Permisos**: solo usuario logueado. Issue se crea con su token OAuth (autoría = su usuario GitHub). Requiere scope `repo` (para repos privados) — verificar Better Auth config.
- ✅ **Changelog source**: **GitHub Releases API** (`githubService.listReleases` ya existe + TTL.releases=600s ya configurado). Se rinde como página pública (sin auth) leída desde Redis con fallback a fetch sin token (octokit unauthenticated, rate limit 60/h aceptable para changelog público cacheado).
- ✅ **Mode**: fast (sin researcher; stack conocido, patrón `createOutdatedIssueAction` reutilizable).

## Stack & contexto

- Next.js 16.2.5 (App Router, RSC-first) + React 19. **AGENTS.md**: leer `node_modules/next/dist/docs/` antes de Next code.
- Reutilizar:
  - `src/lib/github/service.ts` → `createIssue` (existe), `listReleases` (existe).
  - `src/lib/github/cache.ts` → `cachedFetch`, `TTL.releases`.
  - `src/app/actions/create-outdated-issue.ts` → patrón server action + zod + redirect.
  - shadcn/ui: `Form`, `Textarea`, `Input`, `Button`, `Card`, `Badge`.
  - `react-markdown` + `remark-gfm` + `rehype-sanitize` (ya en deps) → render notes de release.
- Restricciones: YAGNI/KISS/DRY · archivos > 200 LOC modularizar · sin mocks/datos falsos.

## Constantes nuevas

```ts
// src/lib/github/upstream.ts (nuevo)
export const UPSTREAM_OWNER = "dmaurelc";
export const UPSTREAM_REPO = "maureldev";
```

Toda referencia al repo principal via esta constante. Cero ENV nuevas.

## Fases (orden recomendado, no obligatorio)

| # | Fase | Esfuerzo | Branch | Estado | Archivo |
|---|------|----------|--------|--------|---------|
| 1 | Bug report form → GitHub issue | S-M | `feature/bug-report` | done | [phase-01-bug-report.md](phase-01-bug-report.md) |
| 2 | Public changelog page (releases) | S | `feature/public-changelog` | done | [phase-02-changelog.md](phase-02-changelog.md) |

Recomendado: fase 1 primero (necesita login, prueba flujo issue creation). Fase 2 después (página pública, sin auth requerida para read).

## Flujo Git (por fase)

1. `git checkout develop && git pull`
2. `git checkout -b <branch>`
3. Implementar + commits convencionales (`feat:`, `fix:`, etc.)
4. `git push -u origin <branch>`
5. PR → `develop`. Merge cuando esté revisado.

Release: PR `develop → main` cuando ambas fases hayan mergeado a develop.

## Riesgos cross-fase

| Riesgo | Mitigación |
|--------|------------|
| Repo privado → user sin acceso → 404 al crear issue | OAuth scope `repo` en Better Auth. Mensaje de error claro si falla con 403/404. |
| Rate limit 60/h en changelog sin token (futuro público abierto) | Cache Redis 600s + fallback a payload estático si fetch falla. |
| Spam de bugs (form abierto a cualquier user logueado) | Acepta riesgo. Repo privado por ahora. Cuando se abra → labels auto + posible rate limit per-user (out of scope). |
| Token user sin scope `repo` para repo privado | Verificar Better Auth config; documentar scope requerido. Phase 1 incluye verificación. |

## Siguiente paso

Comienza fase 1: leer `phase-01-bug-report.md`.
