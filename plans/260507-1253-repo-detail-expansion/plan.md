# Repo Detail Expansion + Home Polish

> Status: completed · Created: 2026-05-07 · Branch: feature/repo-detail-expansion

Tweaks chiquitos en home + sidebar, y expansión grande de la vista de repo (tags, releases, contributors, file explorer, insights tab).

## Phases

| Phase | Title | Status |
|-------|-------|--------|
| 01 | Home: NO excluir pinned de "Recently updated" + sidebar link a repo personal | done |
| 02 | Repo aside: Tags + Releases + Contributors | done |
| 03 | Repo tab: File explorer (browse repo contents) | done |
| 04 | Repo tab: Insights (traffic + commit activity + code freq) | done |

## Key Files

- `src/app/(dashboard)/dashboard/page.tsx` — quitar filtro pinned + cambiar copy
- `src/app/(dashboard)/_components/app-sidebar.tsx` — agregar link a repo personal
- `src/app/(dashboard)/repositories/[owner]/[repo]/layout.tsx` — extender aside con secciones nuevas
- `src/app/(dashboard)/repositories/[owner]/[repo]/page.tsx` — refactor: README full width o columna izquierda; aside derecha con bloques
- `src/app/(dashboard)/repositories/_components/repo-tabs-nav.tsx` — agregar tab Insights condicional
- `src/lib/github/service.ts` — métodos `listTags`, `listReleases`, `listContributors`, `getContent`, `getRepoTraffic`, `getCommitActivity`
- New routes:
  - `src/app/(dashboard)/repositories/[owner]/[repo]/insights/page.tsx`
  - `src/app/(dashboard)/repositories/[owner]/[repo]/files/page.tsx` (opcional, depende fase 03)

## Dependencies

Octokit REST methods (todos nativos):
- `repos.listTags`
- `repos.listReleases`
- `repos.listContributors`
- `repos.getContent` (path-based file explorer)
- `repos.getViews` / `repos.getClones` (traffic — requiere push permission, fallback graceful)
- `repos.getCommitActivityStats`

No new deps. Usa Redis cache existente.

## Risks

- **Traffic API** (views/clones) requiere `push` permission. Si fail → ocultar tab Insights o mostrar nota.
- **getContent** sobre repos grandes con muchos archivos → paginar por path, no recursive.
- File explorer client-side state (path navegación) → query param `?path=` server-rendered.
- Aside puede crecer mucho en alto → considerar accordion o tabs internas.

## Pregunta abierta

- Insights: ¿solo si traffic permission OK, o siempre visible con fallback "no permission"?
- File explorer: ¿inline en aside (compacto, top 10 archivos) o tab dedicada `/files`?
