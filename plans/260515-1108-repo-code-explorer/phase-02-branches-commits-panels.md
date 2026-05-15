# Phase 02 — Panel branches + panel commits (lectura)

## Overview
- Priority: P0
- Status: pending
- Estimated effort: M (8-12h)

Implementar 2 paneles izquierdos del layout 3-paneles: panel branches/PRs y panel commits timeline. Solo lectura. Reutiliza `githubService.listBranches`, `listCommits`, `listPullRequests`, `listTags`.

## Context links
- Phase 01: scaffold ruta + switcher
- Reference: `src/app/(dashboard)/repositories/[owner]/[repo]/commits/page.tsx` (lógica branch+commits actual)
- Service methods existentes: `listBranches(userId, owner, repo, perPage)`, `listCommits(...)`, `listPullRequests(...)`, `listTags(...)`

## Key insights
- `listCommits` ya soporta filtros `{ sha, author, since, until, perPage, page }`
- Branches y PRs comparten panel izq con tabs internos (Branches | Pull Requests | Tags)
- Branch seleccionada drive commits del panel centro vía URL state (`?branch=<name>`)
- Default: `default_branch` del repo
- Selected commit drive panel derecho via URL state (`?commit=<sha>`)

## Requirements

### Functional

**Panel izquierdo (branches + PRs + tags):**
- Sub-tabs: `Branches` | `Pull Requests` | `Tags`
- Tab Branches:
  - Lista branches con badge "default" en default_branch
  - Search filter (client-side filter, no API call)
  - Click → selecciona branch (actualiza `?branch=` URL)
  - Indicador visual branch seleccionada
- Tab PRs:
  - Lista PRs abiertos por defecto, filtro state (open/closed/all)
  - Click PR → selecciona branch del PR + commit head + abre panel diff
  - Badge author + número + título
- Tab Tags:
  - Lista tags con SHA + fecha
  - Click → seleccionar commit del tag

**Panel centro (commits timeline):**
- Lista commits de branch seleccionada
- Cada commit muestra: avatar autor, mensaje (1ra línea), SHA corto, fecha relativa
- Filters bar arriba: `Author` (dropdown contributors), `Since` (date), `Until` (date), `Search message` (input)
- Paginación: `Previous` / `Next` (cursor-based via `?page=`)
- Click commit → selecciona commit (`?commit=<sha>`), highlight visual

### Non-functional

- Skeleton loading state por panel
- Empty state con CTA si branch sin commits
- Error state si API falla (graceful, no crash)
- Lazy load branches: 100 max, advertir si truncado
- Mobile: stack vertical, paneles colapsables (drawer)

## Architecture

```
ExplorerLayout (Phase 01)
├── ResizablePanel (left, 25%)
│   └── LeftPanel
│       ├── TabsHeader (Branches | PRs | Tags)
│       ├── SearchInput (client-side filter)
│       └── ItemsList (virtualized si >100 items)
├── ResizablePanel (center, 35%)
│   └── CommitsPanel
│       ├── CommitsFilters (author, dates, search)
│       ├── CommitsList (virtualized)
│       └── CommitsPagination
└── ResizablePanel (right, 40%) — Phase 03
```

## Related code files

**Crear:**
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/left-panel.tsx` — wrapper tabs
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/branches-list.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/prs-list.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/tags-list.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/commits-panel.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/commit-item.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/use-explorer-state.ts` (hook URL state)

**Modificar:**
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/page.tsx` — fetch initial data RSC
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/layout.tsx` — wire paneles

## Implementation steps

1. **URL state hook (`use-explorer-state.ts`):**
   - Lee `?branch`, `?commit`, `?tab` (branches/prs/tags), `?page`
   - Helpers: `setBranch(name)`, `setCommit(sha)`, `setLeftTab(tab)`
   - Usa `useRouter` + `useSearchParams` Next 16

2. **RSC entry (`explorer/page.tsx`):**
   ```tsx
   const [repo, branches, contributors, commits, prs, tags] = await Promise.allSettled([
     githubService.getRepo(userId, owner, repo),
     githubService.listBranches(userId, owner, repo, 100),
     githubService.listContributors(userId, owner, repo, 30),
     githubService.listCommits(userId, owner, repo, { sha: branch, page, perPage: 30 }),
     githubService.listPullRequests(userId, owner, repo, "open", 1, 30),
     githubService.listTags(userId, owner, repo, 50),
   ]);
   ```

3. **LeftPanel (client component):**
   - shadcn `Tabs` con 3 triggers
   - Search input local (no API)
   - Render lista según tab activo

4. **BranchesList:**
   - Map branches → button con `name`, badge `default` si match
   - `onClick` → `setBranch(name)` (URL update)
   - Filter por search query

5. **PRsList:**
   - Filtro state local: open/closed/all
   - Click PR → `setBranch(pr.head.ref)` + `setCommit(pr.head.sha)`

6. **TagsList:**
   - Lista tags con commit SHA + fecha
   - Click → `setCommit(tag.commit.sha)`

7. **CommitsPanel:**
   - Filters bar reutiliza componente `CommitsFilters` existente (importar de `/commits/_components/`)
   - Lista commits con `CommitItem`
   - Pagination cursor con `?page=`

8. **CommitItem:**
   - Avatar + author + relative date (`formatDistanceToNow`)
   - 1ra línea mensaje truncated
   - SHA monospace con copy button
   - Selected state visual

9. **Virtualización:**
   - Si >50 items en lista: `@tanstack/react-virtual` (verificar instalado)
   - Sino: scroll nativo OK

## Todo list

- [ ] Crear hook `use-explorer-state.ts`
- [ ] Implementar `left-panel.tsx` con tabs
- [ ] `branches-list.tsx` con search + selection
- [ ] `prs-list.tsx` con state filter
- [ ] `tags-list.tsx`
- [ ] `commits-panel.tsx` reutilizando filters existentes
- [ ] `commit-item.tsx` con selected state
- [ ] Wire data fetching en `explorer/page.tsx`
- [ ] Skeleton states por panel
- [ ] Empty states (no branches, no commits)
- [ ] Manual test: cambiar branch → commits actualizan; click PR → branch+commit sync
- [ ] Verificar mobile fallback (stack vertical)

## Success criteria

- 3 sub-tabs panel izquierdo funcionan
- Branches search filter local responsive
- Selección branch actualiza commits panel sin full reload
- Selección commit guarda URL state para phase 03
- Paginación commits funciona
- Sin crash si repo sin PRs/tags
- Cache Redis ETag se usa (verificar headers en network tab)

## Risks

- **URL state thrashing**: muchas params (`?branch&commit&tab&page&author&since&until`). Considerar consolidar en JSON encoded param.
- **Repos con muchas branches**: 100 cap. Mostrar mensaje "showing 100 of N" si truncado.
- **Filter dates UX**: input native date picker o shadcn `Calendar`. Decidir consistencia con `/commits` actual.

## Security

- Validar `branch`, `commit`, `author` searchParams: solo `[a-zA-Z0-9._/-]+`
- No exponer info repos privados a usuarios sin acceso (githubService ya gestiona via token)

## Next steps
→ Phase 03: panel derecho (diff + checks + PRs detalle)
