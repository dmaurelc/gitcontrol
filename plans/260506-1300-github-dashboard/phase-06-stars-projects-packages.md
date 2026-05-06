# Phase 06 — Stars, Projects, Packages

## Context Links
- [plan.md](plan.md) · [phase-05-repositories.md](phase-05-repositories.md)

## Overview
- **Priority**: P2
- **Status**: pending
- Vistas read-only para repos starreados, GitHub Projects v2 (GraphQL) y Packages.

## Key Insights
- **Stars**: REST `GET /user/starred` paginado
- **Projects v2**: solo GraphQL. Query `user(login){projectsV2(first:20){nodes{...}}}` y `organization(login){projectsV2}`
- **Packages**: REST `GET /users/{user}/packages?package_type=npm|container|...` requiere scope `read:packages`. Para orgs: `GET /orgs/{org}/packages`

## Requirements
**Funcionales**
- `/stars`: lista starred repos con filtros (lang, sort by starred_at)
- `/projects`: lista projects v2 del contexto activo, click → detalle con items
- `/packages`: lista por tipo (npm, container, maven, nuget, rubygems)

**No funcionales**
- Cache TTL 10min (cambian poco)

## Architecture
```
src/app/(dashboard)/
├── stars/page.tsx
├── projects/
│   ├── page.tsx
│   └── [id]/page.tsx
└── packages/
    ├── page.tsx
    └── _components/package-card.tsx

src/lib/github/
├── service.ts           # añadir listStars, listProjectsV2, getProjectV2, listPackages
└── graphql/projects.ts  # GraphQL queries
```

## Related Code Files
**Crear**
- `src/app/(dashboard)/stars/page.tsx`
- `src/app/(dashboard)/projects/page.tsx`
- `src/app/(dashboard)/projects/[id]/page.tsx`
- `src/app/(dashboard)/packages/page.tsx`
- `src/lib/github/graphql/projects.ts`

## Implementation Steps
1. Service `listStars(userId, {sort, direction, page})` usa REST con header `Accept: application/vnd.github.star+json` para incluir `starred_at`
2. `graphql/projects.ts`: queries tipadas:
   - `LIST_USER_PROJECTS_V2`
   - `LIST_ORG_PROJECTS_V2`
   - `GET_PROJECT_V2_ITEMS`
3. Service `listProjectsV2(userId, ctx)` selecciona query según tipo de contexto
4. Service `listPackages(userId, ctx, type?)` con `package_type` filter
5. `stars/page.tsx`: lista con repo-card reusable + filtro language/sort
6. `projects/page.tsx`: grid de cards con title, shortDescription, itemsCount
7. `projects/[id]/page.tsx`: tabla con items (title, status, assignees) — usar shadcn `Table`
8. `packages/page.tsx`: tabs por package_type
9. Commit: `feat: stars, projects v2 and packages views`

## Todo List
- [ ] Service: listStars con starred_at
- [ ] GraphQL queries Projects v2
- [ ] Service: listProjectsV2 + getProjectV2
- [ ] Service: listPackages
- [ ] Stars page con filtros
- [ ] Projects list page
- [ ] Project detail con items
- [ ] Packages page con tabs por tipo
- [ ] Empty states amigables

## Success Criteria
- Stars listan ordenables por fecha de starred_at
- Projects v2 visibles tanto user como org
- Project detail muestra items con estado
- Packages aparecen filtrables por tipo

## Risk Assessment
- **Projects v2 GraphQL complexity**: campos varían por field types (single-select, date, number); MVP solo title+status
- **Packages scope**: si user no tiene `read:packages`, fallback con mensaje "permission required"
- **GraphQL rate limit**: usa point system distinto (5000 points/h); queries grandes consumen más

## Security Considerations
- Validar contexto activo antes de cada query
- No exponer IDs internos en URL público sin necesidad

## Next Steps
→ Phase 07: Settings
