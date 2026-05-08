# Phase 05 — Cmd+K repos search index

> Branch: `feature/cmdk-repos-index` · PR target: `develop` · Esfuerzo: M

## Contexto

- Cmd+K shell ya existe (`src/components/command-palette.tsx` + `command-palette-server.tsx`).
- Hoy lista navegación estática + acciones — sin búsqueda de entidades.
- Decisión: indexar **solo repos** (owner/name + descripción) en v1. Issues/PRs/orgs futuro.

## Insights clave

- Repos del usuario ya cacheados vía `listRepos` (TTL 300s).
- Fuzzy matching client-side con `fuse.js` (~5KB gzip) sobre dataset limitado (≤ ~500 repos típico).
- Server hidrata índice desde Redis en RSC pre-render del `command-palette-server.tsx`.
- Sin schema change.

## Requisitos

**Funcionales**
- Cmd+K abre palette → user escribe → resultados fuzzy entre repos del viewer + orgs activas.
- Cada result: avatar org, owner/name, descripción, stars. Enter → navega `/repositories/[owner]/[repo]`.
- Indexa todos los repos accesibles (viewer + orgs activas — respeta context cookie).
- Refresca índice on-demand vía `revalidatePathAction("/")` cuando user invalida cache.

**No funcionales**
- Latencia búsqueda < 50ms para 500 repos.
- Bundle ext: fuse.js ≈ 5KB gzip — aceptable.

## Arquitectura

```
RSC: command-palette-server.tsx
  → buildSearchIndex(userId)
       → fetch listRepos(viewer + orgs)
       → flatten { owner, name, description, stars, updatedAt, avatarUrl }
       → cache 300s (key: cmdk:repos:{userId})
  → pasa array a <CommandPalette index={...} />

Client: command-palette.tsx
  → Fuse({ keys: ["owner", "name", "description"] })
  → onChange query → fuse.search() → top 10
  → enter → router.push(/repositories/[owner]/[name])
```

## Archivos

**Crear**
- `src/lib/search/repos-index.ts` — `buildReposIndex(userId)` + tipo `RepoIndexEntry`.
- `src/components/command-palette-repos-section.tsx` — sub-render dentro del palette.

**Modificar**
- `src/components/command-palette-server.tsx` — pasa `reposIndex` a client.
- `src/components/command-palette.tsx` — agrega `useMemo(() => new Fuse(...))` + sección "Repositories".
- `package.json` — `pnpm add fuse.js`.

## Pasos

1. `pnpm add fuse.js`.
2. Crear `buildReposIndex(userId)` — usa `cachedFetch` con key `cmdk:repos:{userId}`, dentro hace listRepos viewer + orgs activas (paralelo), aplana a `RepoIndexEntry[]`.
3. Hidratar `command-palette-server.tsx` con índice → pasa por prop al cliente.
4. Cliente: `useMemo(() => new Fuse(index, { keys, threshold: 0.3 }))`.
5. Renderizar sección "Repositories" con `command.tsx` shadcn (CommandGroup, CommandItem).
6. Probar: 100+ repos, fuzzy search rápido, navegación correcta.

## Acceptance

- [ ] Cmd+K muestra sección "Repositories" con resultados fuzzy.
- [ ] Match en owner, name, descripción.
- [ ] Enter navega a `/repositories/[owner]/[name]`.
- [ ] Indexa repos viewer + orgs activas.
- [ ] Refresca con cache GitHub (sin segunda llamada si cache fresca).
- [ ] Bundle ≤ 8KB extra gzip.

## Riesgos

- Datasets muy grandes (>2k repos en orgs grandes) → fuse.js lento. **Mitigación**: cap a top 1000 por updatedAt.
- Privacidad: repos privados aparecen en palette — esperado (user es dueño/colaborador).

## Open Questions

- ¿Activar entidades adicionales (issues, PRs) en próxima fase Wave 6? **Sí**, fuera de scope #5.
- ¿Persistir últimas 5 búsquedas? Skip para v1.
