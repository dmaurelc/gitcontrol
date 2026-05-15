# Phase 04 — UX polish: keyboard nav, deep links, responsive, errors

## Overview
- Priority: P1
- Status: pending
- Estimated effort: S-M (6-8h)

Cierre de la vista lectura. Pulir interacciones: atajos teclado, deep linking, responsive mobile, loading/empty/error states finos. Esta fase deja MVP shippeable sin edición.

## Context links
- Phases 01-03 completas
- Patterns existentes: `EmptyState` componente (`src/components/empty-state.tsx`)

## Key insights
- Tres paneles requieren navegación rápida — keyboard shortcuts elevan UX a nivel IDE
- Deep linking: cualquier estado debe ser shareable (URL contiene branch + commit + tab + page)
- Mobile <768px: 3-paneles no caben → stack vertical con tabs nativos o drawer

## Requirements

### Functional

**Keyboard shortcuts:**
- `j` / `k` → next/prev commit en panel centro
- `h` / `l` → toggle panel izq / der visibility
- `b` → focus search branches
- `c` → focus search commits
- `/` → focus search global panel activo
- `Esc` → clear selection / close modal
- `?` → show shortcuts overlay

**Deep linking:**
- URL `/repositories/[o]/[r]/explorer?branch=feat/x&commit=abc123&tab=files&leftTab=prs`
- Compartir URL restaura estado completo
- Browser back/forward respeta historial selecciones

**Responsive (desktop-first):**
- `>= 1024px`: 3-paneles horizontal (default)
- `768-1023px`: 2-paneles (izq + centro), panel derecho slide-over (drawer al seleccionar commit)
- `< 768px`: **explorer NO disponible**. Switcher view-mode oculto. Si user llega via deep-link `/explorer` desde mobile → redirect a `/repositories/[o]/[r]` (tabs) con toast informativo "Explorer view requires a larger screen".

**Error states:**
- API GitHub falla → toast notification + retry button por panel
- Rate limit exceeded → mensaje claro con tiempo reset
- Repo sin acceso (403) → mensaje "No access" + link a settings
- Branch eliminado → fallback default branch

**Loading states:**
- Skeleton específico por panel (no spinner genérico)
- Optimistic UI en switcher panels
- Progressive disclosure: panel izq cargado primero, centro al elegir branch, derecho al elegir commit

**Empty states:**
- Repo sin commits: mensaje + CTA crear primer commit (link GitHub)
- Branch sin commits diferentes a default: "This branch is up to date with default"
- Sin PRs: "No pull requests" + CTA crear (preparar para fase 05)
- Sin tags: "No tags yet"

### Non-functional
- Atajos teclado no chocan con shadcn cmdk (`Cmd+K` reservado)
- Shortcuts overlay accesible (`?` o `Cmd+/`)
- Focus management en cambio panel (focus visible)

## Architecture

```
ExplorerLayout
├── KeyboardShortcutsProvider (context)
├── ResponsiveProvider (detect breakpoint)
├── MobileBlocker (<768px) — redirect + toast
├── PanelsContainer
│   ├── DesktopLayout (>=1024px) — 3 paneles
│   └── TabletLayout (768-1023px) — 2 paneles + drawer
└── ShortcutsOverlay (modal)
```

## Related code files

**Crear:**
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/keyboard-shortcuts-provider.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/shortcuts-overlay.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/_components/mobile-blocker.tsx` (redirect + toast)
- `src/hooks/use-breakpoint.ts` (si no existe)

**Modificar:**
- `src/app/(dashboard)/repositories/[owner]/[repo]/explorer/layout.tsx` — wrap providers + responsive logic
- Componentes panel: agregar `data-shortcut-target` para focus management

## Implementation steps

1. **Hook `use-breakpoint`:**
   ```ts
   export function useBreakpoint() {
     // tailwind breakpoints: sm 640, md 768, lg 1024, xl 1280
     // returns "mobile" | "tablet" | "desktop"
   }
   ```

2. **KeyboardShortcutsProvider:**
   - Listen `keydown` global
   - Ignore si target es input/textarea/contenteditable
   - Dispatch acciones según tecla → actualizar URL state vía `useExplorerState`

3. **ShortcutsOverlay:**
   - Modal shadcn `Dialog`
   - Tabla `Key | Action`
   - Trigger `?` keydown

4. **MobileBlocker:**
   - Detecta `<768px` via `useBreakpoint`
   - useEffect: si activo → `router.replace("/repositories/[o]/[r]")` + `toast.info("Explorer view requires a larger screen")`
   - También: ocultar opción `Explorer` en switcher cuando breakpoint mobile
   - Server-side: en `explorer/page.tsx` leer header `user-agent` opcional (best-effort) o dejar fallback client-side

5. **TabletLayout:**
   - 2 paneles fijos (izq + centro)
   - `Sheet` shadcn slide-over para detalle (panel derecho)
   - Auto-open al seleccionar commit

6. **Skeletons específicos:**
   - `BranchesListSkeleton`, `CommitsListSkeleton`, `CommitDetailSkeleton`
   - Match layout final (no shift)

7. **Error boundary:**
   - `error.tsx` Next 16 en `/explorer`
   - Por panel: try/catch + fallback con retry button

8. **Empty states:**
   - Reutilizar componente `<EmptyState />` existente
   - Variants: noCommits, noBranches, noPrs, noTags, noAccess

## Todo list

- [ ] Hook `use-breakpoint`
- [ ] `KeyboardShortcutsProvider` con event listener
- [ ] `ShortcutsOverlay` modal
- [ ] `MobileBlocker` con redirect + toast (esconder switcher <768px)
- [ ] `TabletLayout` con sheet/drawer
- [ ] Skeletons específicos por panel
- [ ] `error.tsx` boundary
- [ ] Empty states variants
- [ ] Atajos `j/k` commits navigation
- [ ] Atajos `h/l` toggle paneles
- [ ] Atajos `b/c//` focus search
- [ ] Test responsive en Chrome devtools (mobile, tablet, desktop)
- [ ] Test keyboard nav sin mouse
- [ ] Test deep link share: copiar URL completa, abrir incognito → estado restaurado

## Success criteria

- Keyboard navegación funciona sin mouse para tareas comunes (cambiar branch, scroll commits, ver diff)
- Mobile (<768px): switcher oculto, redirect a tabs si llegado via deep-link, toast informativo
- Tablet: drawer detalle smooth
- Deep links funcionan: pegar URL → estado completo restaurado
- Errores no crashean app — siempre fallback graceful
- Skeletons sin layout shift visible

## Risks

- **Shortcuts conflict**: cuidar `Cmd+K` shadcn cmdk, `Cmd+S` browser save. Solo letras sin modifier en MVP.
- **Mobile UX scope**: resuelto — desktop-only feature. Mobile users no pierden funcionalidad (tabs siguen disponibles). Documentar en docs.
- **Focus traps**: modal shortcuts overlay debe trap focus.

## Security

- Sin nuevas surface APIs. Validaciones URL siguen iguales.

## Next steps
→ Phase 05 (opcional): edición — crear branch, editar archivo, crear PR
