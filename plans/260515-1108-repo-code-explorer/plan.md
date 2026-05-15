---
status: in-progress
created: 2026-05-15
project: gitcontrol-repo-code-explorer
branch: feature/repo-code-explorer
blockedBy: []
blocks: []
---

# Repo Code Explorer — Vista 3-paneles estilo GitHub Copilot Desktop

## Branch
`feature/repo-code-explorer` (desde `develop`). Todo el trabajo en rama nueva.

## Objetivo
Agregar vista alternativa estilo IDE en `/repositories/[owner]/[repo]/*` con layout 3-paneles (branches+PRs / commits / diff+checks) accesible vía **switcher view-mode** (`tabs` ↔ `explorer`). Reutilizar `githubService.*` existente. Agregar capacidades de edición: crear branch, editar archivo single-commit, crear PR.

## Contexto

- Stack actual: Next.js 16 App Router, Drizzle, Postgres VPS (Dokploy), Redis cache ETag, shadcn/ui, Octokit, better-auth.
- Patrón view-mode existente: `src/app/actions/view-mode.ts` con scopes `repos`, `stars`. Extender con `repoDetail`.
- Tabs actuales coexisten: Overview, Files, Commits, Issues, Pulls, Actions, Dependencies, Insights. NO se eliminan.
- `githubService` ya tiene: `listBranches`, `listCommits`, `getContent`, `listPullRequests`, `listTags`, `listContributors`. Falta: write methods.
- Service 2105 LOC → modularizar writes en archivo separado `service-write.ts`.

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 01 | View-mode switcher + scaffold ruta `/explorer` | pending | [phase-01-view-mode-switcher.md](phase-01-view-mode-switcher.md) |
| 02 | Panel branches + panel commits (lectura) | pending | [phase-02-branches-commits-panels.md](phase-02-branches-commits-panels.md) |
| 03 | Panel derecho: diff archivos + checks CI + PRs | pending | [phase-03-diff-checks-pr-panel.md](phase-03-diff-checks-pr-panel.md) |
| 04 | Polish UX: keyboard nav, deep-links, responsive, empty/error states | pending | [phase-04-ux-polish.md](phase-04-ux-polish.md) |
| 05 | Edición: crear branch + editar archivo single-commit + crear PR | pending | [phase-05-edit-actions.md](phase-05-edit-actions.md) |

## Build order

Fases 01-04 secuenciales (lectura). Fase 05 al final (edición tiene riesgo escritura GitHub, requiere fase 04 estable).

## Key files (alto nivel)

**Nuevos:**
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/page.tsx` — RSC entry
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/layout.tsx` — 3-paneles resizable
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/` — `branches-panel.tsx`, `commits-panel.tsx`, `diff-panel.tsx`, `checks-panel.tsx`, `file-tree.tsx`
- `src/lib/github/service-write.ts` — `createBranchRef`, `createOrUpdateFile`, `createPullRequest`
- `src/app/actions/repo-edit.ts` — server actions con `runAction` + `enforceRateLimit`

**Modificados:**
- `src/app/actions/view-mode.ts` — agregar scope `repoDetail`
- `src/lib/preferences/get-user-preferences.ts` — incluir `readViewMode(filters, "repoDetail")`
- `src/app/(dashboard)/repositories/[owner]/[repo]/layout.tsx` — montar switcher tabs/explorer
- `src/app/(dashboard)/repositories/_components/repo-tabs-nav.tsx` — ocultar tabs cuando modo `explorer`

## Out of scope

- Edición multi-archivo en un commit (solo un archivo por commit en MVP)
- Terminal embebido / ejecutar código
- Resolver merge conflicts UI
- Mover/renombrar/eliminar archivos
- Editar PRs existentes desde explorer (usar tab `/pulls/[n]` existente)
- Caché Postgres long-term (Redis ETag suficiente)
- **Mobile explorer view**: feature desktop-only. En mobile (<768px) switcher oculto, usuario usa tabs. Tablet (768-1023px) sigue soportado con 2-paneles + drawer.

## Mobile policy

- `< 768px`: switcher view-mode **oculto**. Forzar `tabs` (sin redirect, simplemente no renderizar opción explorer). Si user tiene preferencia `explorer` guardada y entra desde mobile → fallback a tabs + toast "Explorer view requires a larger screen".
- `768-1023px`: 2-paneles (izq + centro) + sheet drawer panel derecho.
- `>= 1024px`: 3-paneles horizontal completo.

## Service modularization policy

Ya 2105 LOC. **Decisión revisada:**

- `service.ts` exporta objeto `githubService` con todos métodos. Split por re-export `export *` NO funciona para objetos — rompería `githubService.X` calls.
- Phase 03: agregar 3 nuevos métodos al objeto en `service.ts` (incremental). No modularizar todavía.
- Phase 05 (writes): nuevo archivo `service-write.ts` exportando **objeto separado** `githubServiceWrite` (no mezcla con reads).
- Modularización profunda de `service.ts` queda como **tarea futura post-feature** (refactor independiente). Requiere split objeto en sub-objetos o pattern composición.
- Aceptable target temporal: `service.ts` <2400 LOC tras phase 03.

## Success criteria

- Switcher persiste preferencia en `userPreferences.filters.viewMode.repoDetail` (`tabs` default | `explorer`)
- Vista `explorer`: 3 paneles redimensionables, branch selector funcional, lista commits paginada, click commit → diff panel
- Panel derecho muestra: archivos cambiados con diff, checks status (verde/rojo/amarillo), PR badge si commit es head de PR
- Edición: crear branch desde dropdown, editar archivo individual (Monaco read-only + edit mode), commit message form, crear PR desde branch
- No regresión en tabs clásicos (siguen funcionando idénticos)
- Mobile: fallback a stack vertical (no 3-paneles)

## Risks

- **Service file size**: ya 2105 LOC. Writes deben ir a archivo separado para no inflarlo más.
- **Rate limit edición**: bucket dedicado `gh:write` 10/60s. Compartir patrón con `gh:merge` existente.
- **Path traversal en getContent**: validar path en server action no contenga `..`
- **Monaco editor bundle size**: lazy-load only en modo edit. Lighter alternative: `react-codemirror` (~80KB vs Monaco ~2MB).
- **Mobile UX**: resuelto — desktop-only feature, switcher oculto <768px (ver Mobile policy).
- **Octokit write permissions**: token usuario debe tener scope `repo` (no solo `public_repo`). Validar OAuth scopes en login.

## Security

- Validar todos los paths con regex `^[a-zA-Z0-9._/-]+$` y reject `..`
- Server actions edición usan `runAction` + Zod + `enforceRateLimit`
- Confirmación UI antes de commit (mostrar diff antes enviar)
- No exponer SHA edit en URL queries (usar form POST)
- Audit log opcional fase futura

## Documentation impact

- `docs/codebase-summary.md`: agregar fila routing `/explorer` + módulo `service-write.ts`
- `docs/system-architecture.md`: nada (sin cambios arquitectura)
- `docs/project-roadmap.md`: marcar feature en wave actual
- `docs/project-changelog.md`: entry al cerrar PR

## Next steps

1. Ejecutar Phase 01: switcher + scaffold ruta
2. Implementar Phase 02: paneles lectura
3. Phase 03: diff + checks + PRs
4. Phase 04: polish
5. Phase 05: edición (opcional, ship 04 antes si tiempo)
