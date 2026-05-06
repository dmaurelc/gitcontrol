# Phase 01 — Visibility Filters (orgs + repos)

## Context Links
- [plan.md](plan.md)

## Overview
- **Priority**: P1
- **Status**: pending
- User pidió poder ocultar orgs masivamente + ocultar repos puntuales. OAuth App da acceso a todo, este filtro es UX-only (no seguridad).

## Key Insights
- Two-level filter: org-level (bulk) + repo-level (override)
- Datos viven en `user_preferences` (jsonb arrays)
- Filtro aplica en `/repositories` list + `/dashboard` recent repos + Pinned section
- No filtra en GitHub API (sigue trayendo todo); filter client/server-side post-fetch

## Requirements
**Funcionales**
- Settings → nueva tab "Visibility"
- Section Organizations: lista con switch on/off (default todos visibles)
- Section Repositories: dropdown buscable, user agrega repos a hidden list
- Hidden repos accesibles si user navega URL directa (`/repositories/owner/repo`)
- Pinned repos NO se ocultan (override implícito)

**No funcionales**
- Setting persiste sin recargar
- Performance: filter en memoria, sin extra API calls

## Architecture
```
user_preferences:
  hidden_orgs: jsonb (text[])    # logins de orgs ocultas
  hidden_repos: jsonb (text[])   # full_names ocultos

Filter logic (lib/preferences/visibility-filter.ts):
  isVisible(repo, prefs, pinnedSet):
    if pinnedSet.has(repo.full_name) → true
    if prefs.hidden_repos.includes(repo.full_name) → false
    if prefs.hidden_orgs.includes(repo.owner.login) → false
    → true
```

## Related Code Files
**Crear**
- `src/app/(dashboard)/settings/_components/visibility-tab.tsx`
- `src/app/(dashboard)/settings/_components/org-visibility-list.tsx`
- `src/app/(dashboard)/settings/_components/hidden-repos-manager.tsx`
- `src/lib/preferences/visibility-filter.ts`
- Migration: añadir `hidden_orgs`, `hidden_repos` a `user_preferences`
- Server actions: `toggleOrgVisibility`, `hideRepo`, `unhideRepo`

**Modificar**
- `src/app/(dashboard)/repositories/page.tsx` — aplicar filter
- `src/app/(dashboard)/dashboard/page.tsx` — aplicar filter en RecentRepos
- `src/lib/db/schema.ts`, `src/lib/preferences/get-user-preferences.ts`
- `src/app/(dashboard)/settings/page.tsx` — nueva tab

## Implementation Steps
1. Migration drizzle: `hidden_orgs jsonb default '[]'`, `hidden_repos jsonb default '[]'`
2. Update `getUserPreferences` para incluir nuevos campos
3. Server actions con Zod validation
4. `visibility-filter.ts` función pura
5. Settings tab "Visibility" con dos sections
6. Cablear filter en list pages
7. Smoke test: hide org → desaparece de listas; pinned repo no afectado
8. PR feat/phase-01-visibility -> develop

## Todo List
- [ ] Migration generate + migrate (local + prod)
- [ ] Schema + getUserPreferences updated
- [ ] visibility-filter.ts + tests
- [ ] Server actions
- [ ] Settings tab UI
- [ ] Filter cableado en /repositories + /dashboard
- [ ] Pinned override verified
- [ ] Build OK + PR

## Success Criteria
- Settings → Visibility tab funcional
- Toggle org → repos de esa org desaparecen de /repositories y /dashboard
- Hidden repo individual → no aparece pero accesible vía URL
- Pinned repos siempre visibles

## Risk Assessment
- Migration en prod: drizzle migrator corre en entrypoint (ya OK desde MVP deploy)
- Performance: si user tiene 500+ repos, filter in-memory OK
- UX confusing: añadir tooltip "Esto solo oculta en UI, GitHub sigue accesible"

## Security Considerations
- No es feature de seguridad, sólo UX
- Server actions verifican session.userId
- Nada se expone vía API pública

## Next Steps
→ Phase 02: Stars filters/sort
