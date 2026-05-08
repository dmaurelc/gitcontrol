# Phase 01 — View mode toggle (grid/list)

> Branch: `feature/view-mode-toggle` · PR target: `develop` · Esfuerzo: S

## Contexto

- Listas de repos (`/repositories`) y PRs (`/pulls`) hoy renderizan único layout (grid de cards repos, lista PRs).
- Power-users quieren densidad alterna: tabla compacta para repos, cards para PRs.
- Persistir preferencia en `user_preferences.filters` (jsonb existente) — no agregar columna nueva.

## Insights clave

- `userPreferences.filters` ya es `Record<string, unknown>` jsonb — campo libre para `{ viewMode: { repos: "grid"|"list", pulls: "grid"|"list" } }`.
- Patrón existente: `repo-filters.tsx` controla estado vía URL search params; mantener consistencia.
- Toggle vive en client component pequeño junto a `repo-filters.tsx` y `pulls/page.tsx`.

## Requisitos

**Funcionales**
- Toggle visible en `/repositories` y `/pulls` (lg+) y mobile.
- Selección persiste por usuario (cookie/DB) + reflejada inmediatamente en UI.
- Default: `grid` (comportamiento actual).
- Cambio actualiza `user_preferences.filters.viewMode.<scope>` vía server action.

**No funcionales**
- Sin layout shift al cambiar.
- Cambio aplica sin recargar página (router refresh ok).

## Arquitectura

```
[ViewModeToggle (client)]  →  toggleViewModeAction (server)
        │                              │
        ▼                              ▼
  shadcn ToggleGroup           userPreferences.filters
                                       │
                                       ▼
                          revalidatePath(/repositories|/pulls)
```

- `ViewModeToggle` recibe `current: "grid"|"list"` + `scope: "repos"|"pulls"`.
- Server lee prefs → pasa a layout que renderiza Grid o List.

## Archivos

**Crear**
- `src/components/view-mode-toggle.tsx` — client component (shadcn ToggleGroup, iconos `Grid3x3` / `List`).
- `src/app/actions/view-mode.ts` — `setViewModeAction({ scope, mode })`.
- `src/app/(dashboard)/repositories/_components/repo-list-row.tsx` — fila compacta para modo lista.
- `src/app/(dashboard)/pulls/_components/pull-list-row.tsx` — fila compacta PRs.

**Modificar**
- `src/lib/preferences/get-user-preferences.ts` — agregar tipo `viewMode` al shape de `filters`.
- `src/app/(dashboard)/repositories/page.tsx` — leer `viewMode.repos`, render condicional.
- `src/app/(dashboard)/pulls/page.tsx` — leer `viewMode.pulls`, render condicional.
- `src/app/(dashboard)/repositories/_components/repo-filters.tsx` — incluir toggle en barra.

## Pasos

1. Extender tipo `UserPreferences["filters"]` con `viewMode?: { repos?: "grid"|"list"; pulls?: "grid"|"list" }`.
2. Crear `setViewModeAction` con validación Zod del scope/mode.
3. Crear `ViewModeToggle` (shadcn ToggleGroup) — recibe initial + scope.
4. Crear `RepoListRow` y `PullListRow` (variantes compactas — name, language, stars, updatedAt).
5. Wire en `repositories/page.tsx` y `pulls/page.tsx`: render `<RepoCard>` o `<RepoListRow>` según prefs.
6. Probar: toggle en `/repositories`, refresh página → modo persiste. Idem `/pulls`.

## Acceptance

- [ ] Toggle visible en `/repositories` y `/pulls`.
- [ ] Cambio actualiza UI sin recargar.
- [ ] Refresh respeta selección.
- [ ] Default grid intacto para usuario sin pref guardada.
- [ ] Mobile: toggle accesible (no roto en `<lg`).

## Riesgos

- `filters` jsonb sin schema → typo en key escapa typecheck. Mitigar con tipo estricto en `get-user-preferences.ts`.

## Open Questions

- ¿Aplicar toggle también a `/issues` (cross-repo)? Scout no lo menciona — proponer skip por simetría con #1, decidir en review.
- ¿Recordar último modo o default por usuario? Default por scope (no global) parece más útil; confirmar.
