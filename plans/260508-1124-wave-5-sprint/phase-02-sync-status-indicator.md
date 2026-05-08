# Phase 02 — Sync status indicator (pastilla frescura caché)

> Branch: `feature/sync-status-indicator` · PR target: `develop` · Esfuerzo: S

## Contexto

- maureldev cachea respuestas GitHub 120-3600s en Redis (`lib/github/cache.ts` envelope con `fetchedAt`).
- Hoy frescura es invisible — usuario no sabe si datos son live o de hace 5min.
- Surface `fetchedAt` como "synced 2m ago / live / stale" convierte caché en feature.

## Insights clave

- `CachedEnvelope<T>` ya guarda `fetchedAt: number` (epoch ms) — solo falta exponerlo.
- `cachedFetch` retorna `FetchResult<T> = { data, etag, fromCache }` — extender con `fetchedAt`.
- Pastilla = client component pequeño con `useEffect` para refrescar el "hace X min" cada 30s (sin re-fetch GitHub, solo recompute label).

## Requisitos

**Funcionales**
- Cada página principal (dashboard, repositories, repo detail tabs, stars, projects, packages) muestra pastilla con "synced Xm ago".
- Estados visuales:
  - `live`: < TTL/2 → verde "synced Xs ago".
  - `cached`: TTL/2 a TTL → neutral "synced Xm ago".
  - `stale`: > TTL → ámbar "stale, refreshing…" (próximo render hará 304/refresh).
- Click en pastilla → revalidatePath de página actual (force refresh).

**No funcionales**
- No spam de re-renders — recomputar label cada 30s con setInterval.
- Sin red extra al solo mostrar.

## Arquitectura

```
RSC page → cachedFetch → { data, fetchedAt, fromCache }
                              │
                              ▼
                    <SyncStatusBadge fetchedAt={...} ttl={120} />
                              │
                              ▼
              client: setInterval 30s → recompute label
              click → server action revalidatePath(pathname)
```

## Archivos

**Crear**
- `src/components/sync-status-badge.tsx` — client component (Badge shadcn + Tooltip).
- `src/app/actions/revalidate.ts` — `revalidatePathAction(path: string)`.
- `src/lib/github/freshness.ts` — helper puro: `computeFreshness(fetchedAt, ttl) → { state, label }`.

**Modificar**
- `src/lib/github/cache.ts` — extender `FetchResult<T>` con `fetchedAt: number`.
- `src/lib/github/service.ts` — propagar `fetchedAt` en retornos relevantes (dashboard/repos/stars/etc).
- `src/app/(dashboard)/_components/topbar.tsx` — slot opcional para badge (page-specific via context o prop drill).
- `src/app/(dashboard)/dashboard/page.tsx` — pasa fetchedAt más antiguo de los fetchers a topbar/page header.
- `src/app/(dashboard)/repositories/page.tsx` — idem.

## Pasos

1. Extender envelope `cachedFetch` para retornar `fetchedAt` siempre (ya está stored, solo exponerlo).
2. Crear `freshness.ts` con función pura testeable (sin importar incluso si no hay tests todavía).
3. Crear `SyncStatusBadge` client + server action `revalidatePathAction`.
4. Decidir surface: page header vs topbar slot. Recomendado: **page header** local (cada page lo agrega donde sabe el TTL aplicable).
5. Wire en pages principales (dashboard, /repositories, /repositories/[owner]/[repo]/overview, /stars, /projects).
6. Probar: cargar página → ver "live", esperar > TTL → estado "stale" + click refresh.

## Acceptance

- [ ] `FetchResult<T>` incluye `fetchedAt`.
- [ ] Pastilla aparece en dashboard, repositories, repo detail, stars.
- [ ] 3 estados visuales correctos (live / cached / stale).
- [ ] Click revalidatePath → datos refrescan.
- [ ] Tooltip muestra timestamp absoluto + TTL.
- [ ] Sin re-render-loop ni leak de setInterval.

## Riesgos

- Si page hace múltiples `cachedFetch` con TTLs distintos, ¿qué `fetchedAt` mostrar? **Decisión**: el más antiguo (peor caso) + TTL más corto entre los usados.
- `revalidatePath` desde client action requiere wrapping `"use server"` — confirmar API en Next 16 (leer `node_modules/next/dist/docs/`).

## Open Questions

- ¿Pastilla por página o global topbar (always-on)? Global más visible, page-local más preciso. **Propuesta**: page-local en v1.
- ¿Persistir setting "siempre mostrar / solo cuando stale"? Skip para v1 (YAGNI).
