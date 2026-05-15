# Phase 01 — View-mode switcher + scaffold ruta `/explorer`

## Overview
- Priority: P0 (bloqueante para fases siguientes)
- Status: pending
- Estimated effort: S (4-6h)

Agregar switcher persistente que alterna entre vista `tabs` (actual) y `explorer` (nueva). Crear scaffold ruta `/explorer` con layout 3-paneles vacío.

## Context links
- Patrón existente: `src/app/actions/view-mode.ts`
- Helper: `src/lib/preferences/get-user-preferences.ts` → `readViewMode(filters, scope)`
- Schema: `userPreferences.filters` jsonb con shape `{ viewMode: { repos: "grid"|"list", stars: "grid"|"list" } }`

## Key insights
- View-mode action ya soporta scopes dinámicos vía `jsonb_set` con path `{viewMode,<scope>}`
- Solo agregar `repoDetail` al type/validación, no requiere migración DB
- shadcn ya tiene componente `Tabs`/`ToggleGroup` — usar para switcher

## Requirements

### Functional
- Switcher visible en topbar del repo detail (al lado del nombre repo o en `repo-tabs-nav.tsx`)
- Opciones: `Tabs` (default) | `Explorer`
- Persistir preferencia por usuario en `userPreferences.filters.viewMode.repoDetail`
- Default `tabs` para usuarios existentes
- Cuando `explorer` activo: ocultar `RepoTabsNav`, redirigir `/repositories/[o]/[r]/*` → `/explorer`
- Cuando `tabs` activo: ocultar `/explorer`, comportamiento actual

### Non-functional
- Switch instant (server action + `revalidatePath`)
- Sin layout shift entre modos
- Accessible: aria-label en toggle

## Architecture

```
RepoDetailLayout
├── RepoHeader (existente)
├── ViewModeSwitcher (nuevo) — client component
│   └── setRepoDetailViewMode(mode) action
├── { viewMode === "tabs" ? <RepoTabsNav /> : null }
└── { children | <ExplorerLayout /> }
```

## Related code files

**Modificar:**
- `src/app/actions/view-mode.ts` — agregar `repoDetail` al Zod schema `scope` enum
- `src/lib/preferences/get-user-preferences.ts` — extender type `ViewModeScope`
- `src/app/(dashboard)/repositories/[owner]/[repo]/layout.tsx` — mount switcher + lógica condicional
- `src/app/(dashboard)/repositories/_components/repo-tabs-nav.tsx` — recibir prop `hidden` o renderizar condicional desde layout

**Crear:**
- `src/app/(dashboard)/repositories/[owner]/[repo]/_components/repo-view-mode-switcher.tsx` (client component, ~80 LOC)
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/page.tsx` (RSC, placeholder)
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/layout.tsx` (3-paneles esqueleto)

## Implementation steps

1. **Extender view-mode action:**
   ```ts
   // src/app/actions/view-mode.ts
   const viewModeSchema = z.object({
     scope: z.enum(["repos", "stars", "repoDetail"]),
     mode: z.enum(["grid", "list", "tabs", "explorer"]),
   });
   ```

2. **Helper preferences:**
   ```ts
   // src/lib/preferences/get-user-preferences.ts
   export function readViewMode(
     filters: UserFilters | null,
     scope: "repos" | "stars" | "repoDetail",
   ): string {
     const defaults = { repos: "grid", stars: "grid", repoDetail: "tabs" };
     return filters?.viewMode?.[scope] ?? defaults[scope];
   }
   ```

3. **Componente switcher:**
   - `ToggleGroup` shadcn con 2 opciones (icon: `LayoutGrid` / `Columns3`)
   - Optimistic update vía `useTransition`
   - Server action `setViewModeAction("repoDetail", mode)`

4. **Layout repo modificar:**
   ```tsx
   // src/app/(dashboard)/repositories/[owner]/[repo]/layout.tsx
   const prefs = await getUserPreferences(userId);
   const repoView = readViewMode(prefs.filters, "repoDetail");
   // pasar repoView a header/nav
   ```

5. **Redirect logic:**
   - Si modo `explorer` y path actual = `/repositories/[o]/[r]/*` (tabs) → `redirect("/repositories/[o]/[r]/explorer")`
   - Si modo `tabs` y path = `/explorer` → `redirect("/repositories/[o]/[r]")`
   - Implementar en `layout.tsx` usando `headers().get("x-pathname")` o middleware

6. **Scaffold `/explorer`:**
   - `layout.tsx` con CSS grid 3 columnas resizables (`react-resizable-panels` ya instalado? verificar)
   - `page.tsx` placeholder texto "Explorer view — fase 02"

7. **Test manual:**
   - Cambiar switcher → preferencia persiste tras refresh
   - Navegar `/repositories/owner/repo` con modo explorer → redirect a `/explorer`
   - Volver a `tabs` desde `/explorer` → redirect a `/`

## Todo list

- [ ] Crear rama `feature/repo-code-explorer` desde `develop`
- [ ] Extender Zod schema en `view-mode.ts`
- [ ] Actualizar `readViewMode` helper con scope `repoDetail`
- [ ] Crear `repo-view-mode-switcher.tsx`
- [ ] Mount switcher en `layout.tsx` repo
- [ ] Implementar redirect logic tabs ↔ explorer
- [ ] Scaffold `/explorer/layout.tsx` con 3 columnas placeholder
- [ ] Scaffold `/explorer/page.tsx` placeholder
- [ ] Verificar `react-resizable-panels` instalado, sino `pnpm add react-resizable-panels`
- [ ] Manual smoke test
- [ ] Commit + push rama

## Success criteria

- Switcher visible y funcional en cualquier subruta del repo
- Preferencia persiste en DB
- Redirect bidireccional funciona sin loops
- Tabs clásicos sin regresión cuando modo `tabs`
- `/explorer` accesible solo cuando modo activo

## Risks

- **Redirect loop**: cuidado lógica condicional, agregar guard
- **Pathname detection en RSC**: Next 16 no expone pathname directo en server. Alternativa: middleware o pasar via params/searchParams

## Security

- Server action ya valida Zod input
- `enforceRateLimit` no necesario (preferencia usuario, no GitHub API)

## Next steps
→ Phase 02: implementar paneles izq+centro (branches + commits)
