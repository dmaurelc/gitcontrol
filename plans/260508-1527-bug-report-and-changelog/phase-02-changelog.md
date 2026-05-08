# Phase 2 — Public Changelog Page

## Context

- Service method: `githubService.listReleases` en [src/lib/github/service.ts:631](../../src/lib/github/service.ts)
- Cache TTL: `TTL.releases = 600` ya configurado en [src/lib/github/cache.ts](../../src/lib/github/cache.ts)
- Markdown render libs ya en deps: `react-markdown`, `remark-gfm`, `rehype-sanitize`.
- Constantes: `UPSTREAM_OWNER` / `UPSTREAM_REPO` desde fase 1 (si fase 2 corre primero, créalas aquí).

## Overview

- **Priority**: medium
- **Status**: done
- **Branch**: `feature/public-changelog`
- Página pública `/changelog` (sin auth required) que lista GitHub Releases del repo principal con notas markdown renderizadas.

## Key insights

- `listReleases` actual requiere `userId` (usa token del user). **Problema**: changelog es público, user puede no estar logueado.
- **Solución**: dual path:
  - User logueado → usa `githubService.listReleases(userId, ...)` (token user, mejor rate limit, ETags).
  - Anónimo → fetch directo a `https://api.github.com/repos/{owner}/{repo}/releases` sin auth (rate limit 60/h por IP — OK con cache 600s).
- Cache compartido NO posible (cachedFetch indexa por userId). Para anónimo: cache Redis con key fija `changelog:public:{owner}/{repo}`, TTL 600s.
- Repo privado actual → fetch sin auth devuelve 404. Hasta que el repo se abra, **changelog público funciona solo para users logueados**. Documentar este comportamiento.

## Requirements

### Funcionales

- Ruta `/changelog` (RSC, **fuera** del grupo `(dashboard)` para que no requiera auth — montarla como ruta top-level o en grupo `(public)`).
- Lista los últimos 20 releases ordenados por `published_at` desc.
- Por release muestra:
  - **Tag name** (ej. `v1.2.0`) como heading
  - **Name** (título del release, fallback al tag)
  - **Published date** (formato relativo + absoluto en tooltip)
  - **Pre-release badge** si `prerelease: true`
  - **Body markdown** renderizado con `react-markdown` + `remark-gfm` + `rehype-sanitize`
  - **Link** "View on GitHub" → `release.html_url`
- Si no hay releases: empty state "No releases yet."
- Si fetch falla (404 repo privado + user anónimo): mensaje "Changelog will be public once the repo is open. Sign in to view current releases."
- Link al changelog desde:
  - Footer del dashboard (si existe; sino skip)
  - Página de login (link debajo del form)
  - Sidebar dashboard como "Changelog"

### No funcionales

- File size <200 LOC.
- Cache Redis 600s anónimo, ETag-cached para logueados.
- Markdown sanitizado (`rehype-sanitize`) — no XSS desde release notes.
- Renderiza en server (RSC) — no JS extra para el lector.

## Architecture

```
GET /changelog
  │
  ├─ session? ──Yes──→ githubService.listReleases(userId, OWNER, REPO, 20)
  │                       │ (cachedFetch + ETag, per-user cache)
  │
  └─ No ────────────→ fetchPublicReleases(OWNER, REPO, 20)
                          │ Redis key "changelog:public:{owner}/{repo}"
                          │ TTL 600s
                          │ Fallback: octokit unauthenticated GET
                          ↓
       releases[] → <ChangelogList /> RSC
                       └ <ReleaseCard /> per item
                           └ <ReactMarkdown /> body
```

## Related code files

### Crear

- `src/lib/github/upstream.ts` — si no existe (fase 1). Constantes.
- `src/lib/github/public-releases.ts` — `fetchPublicReleases(owner, repo, perPage)` con cache Redis manual (sin userId).
- `src/app/changelog/page.tsx` — RSC page (top-level, fuera de `(dashboard)`).
- `src/app/changelog/_components/release-card.tsx` — render single release.
- `src/app/changelog/_components/changelog-empty.tsx` — empty/error state.

### Modificar

- `src/app/(dashboard)/_components/app-sidebar.tsx` — entry "Changelog" (icon `Newspaper` o `History`).
- `src/app/(dashboard)/_components/mobile-sidebar.tsx` — misma entry.
- `src/app/login/page.tsx` (verificar path real) — link "View changelog" debajo del form.

## Implementation steps

1. **Asegurar `upstream.ts`** existe (si fase 1 no se hizo, crear acá).
2. **`public-releases.ts`**:
   ```ts
   import "server-only";
   import { Octokit } from "@octokit/rest";
   import { getRedis } from "@/lib/redis/client";
   import type { RepoRelease } from "@/lib/github/service";

   const TTL_SECONDS = 600;

   export async function fetchPublicReleases(
     owner: string,
     repo: string,
     perPage = 20,
   ): Promise<RepoRelease[]> {
     const redis = getRedis();
     const key = `changelog:public:${owner}/${repo}`;
     const cached = await redis.get(key);
     if (cached) return JSON.parse(cached) as RepoRelease[];

     const octokit = new Octokit(); // unauth
     const res = await octokit.rest.repos.listReleases({
       owner, repo, per_page: perPage,
     });
     const data = res.data as unknown as RepoRelease[];
     await redis.set(key, JSON.stringify(data), "EX", TTL_SECONDS);
     return data;
   }
   ```
3. **`/changelog/page.tsx`** (RSC):
   - `const session = await auth.api.getSession({headers: await headers()})`
   - Si session: `releases = await githubService.listReleases(userId, UPSTREAM_OWNER, UPSTREAM_REPO, 20)`
   - Sino: try `fetchPublicReleases(UPSTREAM_OWNER, UPSTREAM_REPO, 20)`; catch 404 → render `<ChangelogEmpty variant="private" />`.
   - Layout: header "Changelog" + lista de `<ReleaseCard release={r} />`.
4. **`release-card.tsx`** (RSC, no `use client` necesario):
   - Card con tag, name, date, prerelease badge.
   - `<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{release.body}</ReactMarkdown>`
   - Link external "View on GitHub" → `release.html_url`.
5. **`changelog-empty.tsx`**: dos variantes (`empty` / `private`).
6. **Layout decisión**: `/changelog` necesita su propio layout simple (sin sidebar). Crear `src/app/changelog/layout.tsx` con header mínimo (logo + back link).
7. **Sidebar entries** (desktop + mobile): item "Changelog" + icon.
8. **Login link**: añadir `<Link href="/changelog">View changelog</Link>` en página login.
9. **Compile check**: `pnpm build`.

## Todo list

- [x] Constantes `UPSTREAM_OWNER` / `UPSTREAM_REPO` (compartidas con fase 1)
- [x] `src/lib/github/public-releases.ts` con cache Redis
- [x] `src/app/changelog/layout.tsx` mínimo
- [x] `src/app/changelog/page.tsx` con dual auth path
- [x] `src/app/changelog/_components/release-card.tsx`
- [x] `src/app/changelog/_components/changelog-empty.tsx`
- [x] Sidebar entries (desktop + mobile)
- [x] Link en login page
- [x] Compile + smoke test (logueado + anónimo)
- [x] Verificar markdown render correcto (codeblocks, links, listas)

## Success criteria

- `/changelog` accesible sin login → muestra releases (cuando repo sea público) o mensaje claro mientras es privado.
- Logueado → siempre funciona (usa token user).
- Markdown render: codeblocks, links, listas, headings se ven correctos.
- Cache Redis: segunda visita <100ms (vs >500ms primera).
- Pre-release badge visible.
- Build pasa sin errors.

## Risk assessment

| Riesgo | Mitigación |
|--------|------------|
| Repo privado ahora → anónimo ve mensaje "private" | Documentado. Cuando se abra repo, funciona automáticamente sin code change. |
| Rate limit 60/h sin auth | Cache 600s = 6 hits/h max por release listing. Suficiente. |
| `release.body` con HTML malicioso | `rehype-sanitize` strip tags peligrosas. |
| Octokit sin auth en server-side aún hace requests con IP del server | Aceptable; cache absorbe carga. |
| Layout root conflict (`/changelog` vs `(dashboard)`) | Crear `src/app/changelog/layout.tsx` propio; no usar layout dashboard. |

## Security

- Sin auth para read = intencional (público).
- `rehype-sanitize` previene XSS desde release notes.
- Sin tokens expuestos al cliente.
- No mutaciones desde esta página (solo GET).

## Next steps

Tras ambas fases mergeadas a `develop`: PR `develop → main` para release. Anunciar features en próximo GitHub Release (que aparecerá en el changelog mismo — recursión meta).

## Open questions

- ¿Footer global existe en dashboard donde linkear changelog? Si no, skip footer entry.
- ¿Quieres también RSS feed `/changelog/rss.xml`? Out of scope ahora; añadible después.
