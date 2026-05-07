# Fase 03 — Fix orden "Recently updated" + cap a 6

## Contexto

`RecentRepos` en `dashboard/page.tsx:162-246` llama `githubService.listRepos(userId, { sort: "updated", perPage: 30 })` y muestra 10. Usuario reporta que orden no coincide con github.com.

GitHub home muestra repos por `pushed_at` (último push). El parámetro `sort=updated` de la API REST `repos.listForAuthenticatedUser` ordena por `updated_at` (incluye cambios de metadata: descripción, settings, topics) — NO por push.

## Insights

- Para alinear con github.com: usar `sort=pushed`.
- Tras `filterVisible` (oculta hidden + ordena pinned-first), el orden puede mezclarse. Verificar `filterVisible` para asegurar que respeta orden API cuando no hay pinned/hidden — si no, separar pinned y mantener resto en orden API.
- Cap final: 6.

## Archivos

- `src/app/(dashboard)/dashboard/page.tsx`
- `src/lib/preferences/visibility-filter.ts` (revisar — no modificar salvo necesario)

## Decisión usuario

Pinned repos NO aparecen en "Recently updated" (ya están pinned arriba en `/repositories`, evitar duplicación). Al quitar pin → vuelven a aparecer en lista según orden normal.

## Pasos

1. `filterVisible` NO reordena (verificado en `visibility-filter.ts`). Mantener.
2. En `RecentRepos`:
   - Cambiar `sort: "updated"` → `sort: "pushed"`.
   - Tras `filterVisible`, agregar filtro: `repos.filter(r => !pinnedSet.has(r.full_name))`.
   - `.slice(0, 10)` → `.slice(0, 6)`.
   - `perPage: 30` → `perPage: 20` (margen para filtrar hidden + pinned).
3. Header copy: cambiar `description` "Latest activity across visible repos" → "Last pushed (excluding pinned)".

## Todo

- [ ] Cambiar `sort` a `"pushed"`
- [ ] Excluir pinned del listado
- [ ] `.slice(0, 6)`
- [ ] Build OK

## Criterio éxito

- Lista coincide con orden visible en github.com (sidebar "Top repositories" o "Recent activity").
- Máximo 6 items.

## Riesgos

- Si todos los repos relevantes están pinned y filtramos, lista podría quedar corta. Mostrar empty state existente.
