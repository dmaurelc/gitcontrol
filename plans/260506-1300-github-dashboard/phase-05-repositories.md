# Phase 05 — Repositories

## Context Links
- [plan.md](plan.md) · [phase-04-overview-org-switcher.md](phase-04-overview-org-switcher.md)

## Overview
- **Priority**: P1
- **Status**: pending
- Lista filtrable de repositorios + detalle del repo con tabs (Overview/Issues/Pulls). Crear repo desde UI.

## Key Insights
- Filtros: language, type (all/owner/public/private/forks/sources/member), sort (created/updated/pushed/full_name), direction
- Paginación: `?page=N&per_page=30`
- Búsqueda local sobre página actual + búsqueda server-side via search API si query provided
- Issues y PRs reusan componente `IssueList` con prop `kind`

## Requirements
**Funcionales**
- `/repositories` lista con filtros, sort, search
- `/repositories/[owner]/[repo]` overview (readme, lang stats, branches count, last commit)
- Tabs `/issues` y `/pulls` con filtros state (open/closed/all)
- Botón "New repository" abre dialog y crea repo (POST API)
- Click en repo navega a detalle

**No funcionales**
- URL state (filtros en searchParams para shareable)
- Skeleton loaders durante fetch

## Architecture
```
src/app/(dashboard)/repositories/
├── page.tsx                          # lista (RSC + searchParams)
├── _components/
│   ├── repo-filters.tsx              # client: lang, type, sort
│   ├── repo-list.tsx                 # server
│   ├── repo-card.tsx
│   └── new-repo-dialog.tsx           # client + server action
└── [owner]/[repo]/
    ├── layout.tsx                    # tabs nav
    ├── page.tsx                      # overview
    ├── issues/page.tsx
    └── pulls/page.tsx

src/lib/github/service.ts             # añadir createRepo, getReadme, listLanguages
```

## Related Code Files
**Crear**
- Todos los anteriores
- `src/app/actions/create-repo.ts` (server action)
- shadcn: `dialog form input select tabs badge`

## Implementation Steps
1. Añadir métodos en service: `getReadme`, `listLanguages`, `getBranches`, `getLastCommit`, `createRepo({name, description, private, autoInit, gitignore, license})`
2. `repositories/page.tsx`: parse searchParams (lang, type, sort, dir, q, page) → llamada `listRepos`
3. `repo-filters.tsx`: client component con shadcn `Select`, dispara `router.push` con nuevos searchParams (preserva otros)
4. `repo-card.tsx`: muestra name, desc, lang badge, stars, forks, updated relative
5. `new-repo-dialog.tsx`: form `react-hook-form` + zod, server action `createRepo`, on-success invalida cache + redirige
6. `[owner]/[repo]/layout.tsx`: tabs Overview/Issues/Pulls usando shadcn `Tabs`
7. Overview page: readme renderizado (markdown server-side con `react-markdown` + `rehype-sanitize`), language bar, stats
8. `issues/page.tsx`: lista con filtros state/labels/assignee; reusa `IssueList`
9. `pulls/page.tsx`: idem pero `kind="pr"`
10. Cache invalidation tras `createRepo`: `redis.del(gh:{userId}:repos:*)` (usar SCAN+DEL)
11. Commit: `feat(repositories): list, filters, detail tabs and create repo`

## Todo List
- [ ] Service: createRepo, getReadme, listLanguages, getBranches
- [ ] Lista con searchParams-driven filters
- [ ] Filter components funcionales
- [ ] Repo card
- [ ] New repo dialog + server action
- [ ] Layout con tabs en detalle
- [ ] Overview page con readme renderizado
- [ ] Issues list (read-only)
- [ ] PRs list (read-only)
- [ ] Cache invalidation post-create
- [ ] Mobile responsive

## Success Criteria
- `/repositories?language=TypeScript&sort=updated` filtra correctamente y URL es shareable
- Crear repo desde dialog funciona y aparece en lista
- Detalle muestra readme + lang stats
- Issues/PRs read-only listan correctamente con filtros

## Risk Assessment
- **Markdown XSS**: usar `rehype-sanitize` o `react-markdown` con safe defaults
- **Languages stats lento**: GitHub endpoint por repo es barato; cache 1h
- **Repos privados respeta scope**: ya cubierto por `repo` scope

## Security Considerations
- Render markdown sanitizado
- `createRepo` valida input con Zod (nombre regex, longitud)
- Invalidar cache tras mutación

## Next Steps
→ Phase 06: Stars, Projects (GraphQL), Packages
