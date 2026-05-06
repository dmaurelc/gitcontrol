# Phase 02 — Stars Filters & Sort

## Context Links
- [plan.md](plan.md)

## Overview
- **Priority**: P2
- **Status**: pending
- User pidió filtros para ordenar starred por diferentes parámetros (lang, fecha starred, fecha update, stars del repo).

## Key Insights
- GitHub `/user/starred` endpoint acepta `sort=created|updated` y `direction`
- Para filter por language: filter local (endpoint no soporta)
- "Created" = starred_at, "Updated" = repo pushed_at
- Stars count del repo es field `stargazers_count` ya en payload

## Requirements
**Funcionales**
- `/stars` con filtros: language (dropdown), sort (starred_at/updated/stars-desc), direction
- URL state via searchParams (shareable)
- Search por nombre repo (debounced)
- Pagination (ya existe)

## Architecture
```
src/app/(dashboard)/stars/
├── page.tsx (RSC, lee searchParams)
└── _components/
    └── stars-filters.tsx (client, similar a repo-filters.tsx)

githubService.listStars: añadir params { sort, direction }
```

## Related Code Files
**Modificar**
- `src/lib/github/service.ts` — listStars params
- `src/app/(dashboard)/stars/page.tsx` — searchParams + filters

**Crear**
- `src/app/(dashboard)/stars/_components/stars-filters.tsx`

## Implementation Steps
1. Update `listStars(userId, {sort, direction, page})` con params API
2. `stars-filters.tsx` reusa pattern de `repo-filters.tsx` (DebouncedSearch + Selects)
3. Page.tsx parsea searchParams, llama service, filter local por lang/q
4. Smoke test
5. PR feat/phase-02-stars-filters

## Todo List
- [ ] Service params
- [ ] Filters component
- [ ] Page integration
- [ ] Build OK + PR

## Success Criteria
- Sort por starred_at / updated / stars-desc
- Filter por language
- Search por nombre debounced

## Risk Assessment
- API rate limit: stars endpoint es barato; cache 10min ya en cachedFetch
- Sort "stars-desc" no soportado por API → sort local sobre página actual

## Next Steps
→ Phase 03: cleanup prod
