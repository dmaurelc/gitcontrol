# Phase 03 — Panel derecho: diff archivos + checks CI + PRs

## Overview
- Priority: P0
- Status: pending
- Estimated effort: M-L (10-14h)

Implementar panel derecho (40% ancho). Muestra detalle del commit seleccionado: archivos cambiados con diff, status checks CI, PR asociado si head es commit de PR. Panel cambia contenido según selección en paneles izq/centro.

## Context links
- Phase 02: panel izq + centro emiten `?commit=<sha>`
- Reference patterns: `react-diff-viewer-continued` o `@git-diff-view/react` para render diffs
- Service: necesita método `getCommitWithFiles(owner, repo, sha)` — usar `rest.repos.getCommit` (incluye `files` con `patch`)
- Checks: `rest.checks.listForRef(owner, repo, ref)`
- PR by commit: `rest.repos.listPullRequestsAssociatedWithCommit(owner, repo, sha)`

## Key insights
- `repos.getCommit` retorna `files[]` con `patch` (diff inline). Suficiente para MVP sin necesidad de `compare`.
- Patch viene como string unified diff. Render con lib o custom componente.
- Checks combine `check_runs` + `statuses` (legacy). Usar `listForRef`.
- Si commit pertenece a múltiples PRs (raro), mostrar primero merged.

## Requirements

### Functional

**Estado inicial (sin commit seleccionado):**
- Empty state: "Select a commit to view changes"
- Subtítulo: "Or pick a Pull Request from the left panel"

**Commit seleccionado:**

Header:
- Mensaje commit (full, multi-line)
- Autor avatar + nombre + email
- Fecha absoluta + relativa
- SHA full con copy
- Parent commits (links a otros SHAs)

Tabs internos: `Files (N)` | `Checks (M)` | `PR #X` (condicional)

Tab Files:
- Lista colapsable archivos cambiados
- Por archivo: nombre path + badge `+X -Y`
- Click → expande diff inline
- Render diff: split-view (lado a lado) o unified, toggle
- Archivos binary: "Binary file changed" placeholder
- Archivos renamed: mostrar `from → to`

Tab Checks:
- Lista check runs con: name, conclusion (success/failure/neutral/skipped/cancelled), duration
- Icon color: green/red/yellow/gray
- Link a "Details" → URL externa GitHub
- Resumen top: `X passed, Y failed, Z pending`

Tab PR (si existe):
- PR title + number + state (open/closed/merged)
- Author + reviewers
- Mergeable status
- Link "Open in tabs view" → `/pulls/[number]` ruta existente
- Botón Merge (Phase 05 si edición habilitada)

### Non-functional
- Diff lazy loaded: cargar al expandir archivo (no todo upfront)
- Virtual scroll si >20 archivos
- Syntax highlighting opcional (shiki/prismjs) — diferir si bundle hit grande
- Skeleton mientras fetch commit detail

## Architecture

```
RightPanel
├── EmptyState (no commit selected)
└── CommitDetail
    ├── CommitHeader (message, author, sha, parents)
    ├── TabsNav (Files | Checks | PR)
    ├── FilesTab
    │   └── FileDiffItem[] (collapsible)
    │       └── DiffViewer
    ├── ChecksTab
    │   └── CheckRunItem[]
    └── PrTab (conditional)
        └── PrSummary
```

## Related code files

**Crear:**
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/right-panel.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/commit-detail.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/commit-header.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/files-tab.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/file-diff-item.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/diff-viewer.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/checks-tab.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/pr-tab.tsx`
- `src/app/api/repos/[owner]/[repo]/commit/[sha]/route.ts` — endpoint client-side fetch (o usar server action)

**Modificar / refactor (MANDATORY modularization — service.ts ya 2105 LOC):**
- `src/lib/github/service.ts` — extraer todos los métodos commit-related a archivo nuevo + re-export
- **Crear `src/lib/github/service-reads-commit.ts`** con:
  - `listCommits` (mover desde service.ts)
  - `getCommitDetail(userId, owner, repo, sha)` → `repos.getCommit` (NUEVO)
  - `listChecksForRef(userId, owner, repo, ref)` → `checks.listForRef` (NUEVO)
  - `listPullsAssociatedWithCommit(userId, owner, repo, sha)` → `repos.listPullRequestsAssociatedWithCommit` (NUEVO)
  - Mantener `service.ts` re-exportando: `export * from "./service-reads-commit"`
- Verificar imports existentes (`commits/page.tsx` etc.) siguen funcionando sin cambios
- Target post-fase: `service.ts` <1800 LOC

## Implementation steps

1. **Service methods:**
   ```ts
   async getCommitDetail(userId: string, owner: string, repo: string, sha: string) {
     return cachedFetch(`gh:commit:${owner}/${repo}/${sha}`, async (etag) => {
       const params = { owner, repo, ref: sha };
       return etagFetch(rest.repos.getCommit as AnyEndpoint, params, etag);
     });
   }
   ```
   Mismo patrón para `listChecksForRef` y `listPullsAssociatedWithCommit`.

2. **Endpoint API o server fetch:**
   - Opción A: Endpoint `/api/repos/[o]/[r]/commit/[sha]` con TanStack Query client-side
   - Opción B: RSC fetch en page con `searchParams.commit`
   - **Decisión: Opción B** (RSC) más simple, ya es server-driven. Stream via Suspense.

3. **RightPanel:**
   - Lee `searchParams.commit`
   - Si vacío → `<EmptyState />`
   - Sino → `<CommitDetail sha={commit} />` envuelto en Suspense

4. **CommitDetail (async RSC):**
   - Promise.allSettled([getCommitDetail, listChecksForRef, listPullsAssociatedWithCommit])
   - Render tabs

5. **FilesTab:**
   - Map `commit.files[]` → `FileDiffItem`
   - Cada item collapsible (shadcn `Accordion`)

6. **DiffViewer:**
   - Lib: `react-diff-viewer-continued` (mantenido fork)
   - Props: `oldValue` / `newValue` derivados del patch
   - Para patch unified: parsear lib `parse-diff` o renderizar string raw con CSS coloring
   - **MVP simple**: render patch as preformatted text con CSS classes `.diff-add` / `.diff-del` por línea `+`/`-`

7. **ChecksTab:**
   - Map check_runs → row con icon + name + conclusion badge
   - Link externo a `check.html_url`

8. **PrTab:**
   - Solo render si associated PR existe
   - Card con PR info + link a `/pulls/[number]`

## Todo list

- [ ] **Modularizar**: crear `service-reads-commit.ts`, mover `listCommits` + agregar 3 nuevos métodos, re-export desde `service.ts`
- [ ] Verificar tests/imports existentes no rompen
- [ ] Implementar `right-panel.tsx` con searchParams.commit
- [ ] `commit-header.tsx` con metadata
- [ ] `files-tab.tsx` con accordion
- [ ] `file-diff-item.tsx` lazy expand
- [ ] `diff-viewer.tsx` — empezar simple (preformatted patch con CSS coloring)
- [ ] `checks-tab.tsx` con summary header
- [ ] `pr-tab.tsx` conditional
- [ ] Empty state cuando no commit
- [ ] Suspense fallback skeletons
- [ ] Test: seleccionar commit en panel centro → derecho actualiza
- [ ] Test: commit con muchos files (>20) no rompe
- [ ] Test: commit binary file no crash
- [ ] Test: commit sin checks ni PR (caso común)

## Success criteria

- Click commit en panel centro → panel derecho carga detalle
- Files tab muestra todos archivos con diff
- Checks tab muestra status correcto (verde/rojo/amarillo)
- PR tab solo aparece si commit asociado a PR
- Sin crash en edge cases (binary, sin checks, sin PR, muchos archivos)
- Performance: panel derecho carga <2s para commit típico

## Risks

- **Diff render performance**: archivos enormes (>10k líneas) lag UI. Mitigation: límite render 500 líneas + "View full diff" link.
- **Lib bundle size**: `react-diff-viewer-continued` ~50KB. Aceptable.
- **service.ts crece más**: ya 2105 LOC. Considerar split fase 03 o fase 04 cleanup.
- **Cache key collisions**: `gh:commit:owner/repo/sha` único por commit. SHA inmutable → TTL largo OK (1 día).

## Security

- Validar SHA: solo `[a-f0-9]{40}` o `[a-f0-9]{7,40}`
- No render HTML del patch (solo texto)
- Escape mensajes commit (XSS via commit message)

## Next steps
→ Phase 04: UX polish (keyboard nav, deep links, responsive, empty/error states)
