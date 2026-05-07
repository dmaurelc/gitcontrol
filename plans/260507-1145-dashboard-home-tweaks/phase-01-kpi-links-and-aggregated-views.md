# Fase 01 — Links en KPI cards + vistas agregadas de PRs/Issues

## Contexto

KPIs actuales en `src/app/(dashboard)/dashboard/page.tsx:111-141` no son clickeables. Para PRs e issues no existe vista global; hay que entrar repo por repo. Este plan agrega:

- `href` opcional en `StatCard`.
- Link en KPI "Repositories" → `/repositories`.
- Link en KPI "Stars given" → `/stars`.
- Link en KPI "Open PRs" → `/pulls` (vista nueva).
- Link en KPI "Open issues" → `/issues` (vista nueva).
- Servicio agregador `searchIssuesAcrossRepos` (REST `search.issuesAndPullRequests`).

## Insights

- Octokit ya expone `rest.search.issuesAndPullRequests` — sin dependencia nueva.
- Search API tiene límite 30 req/min — cachear con TTL ≥ 60s.
- Query `is:pr is:open author:@me archived:false` para PRs propios; `is:issue is:open author:@me` o `assignee:@me` (toggle) para issues.
- Para org context: query `is:pr is:open org:{login}`.

## Requisitos

### Funcional

- KPI cards renderean `<Link>` cuando `href` se provee, sin perder estilo `MagicCard`.
- `/pulls` y `/issues` listan items de todos los repos del contexto activo, paginado, con filtros mínimos: state (open/closed), tipo author/assignee/mentions.
- Cada item linkea a `/repositories/{owner}/{repo}/pulls/{n}` o `/issues/{n}`.

### No funcional

- Cache Redis 60s en service.
- SSR + Suspense con skeleton.
- Sin re-arquitecturar: reutilizar `PaginationNav`, `EmptyState`, `PageHeader`.

## Arquitectura

```
StatCard (href?) ──► <Link> wrapper
                      │
                      ├─► /repositories  (existe)
                      ├─► /stars         (existe)
                      ├─► /pulls         (NUEVO) ──► githubService.searchIssuesAcrossRepos({type:"pr"})
                      └─► /issues        (NUEVO) ──► githubService.searchIssuesAcrossRepos({type:"issue"})
```

## Archivos

### Modificar

- `src/components/stat-card.tsx` — añadir prop `href?: string`, envolver con `Link` si existe.
- `src/app/(dashboard)/dashboard/page.tsx` — pasar `href` a cada `StatCard`.
- `src/lib/github/service.ts` — añadir `searchIssuesAcrossRepos(userId, opts)`.

### Crear

- `src/app/(dashboard)/pulls/page.tsx`
- `src/app/(dashboard)/pulls/_components/pull-row.tsx`
- `src/app/(dashboard)/issues/page.tsx`
- `src/app/(dashboard)/issues/_components/issue-row.tsx`

## Pasos

1. Modificar `StatCard` props: agregar `href?: string`. Si existe, wrappear `<Card>` en `<Link href={href} className="block">`.
2. Añadir `searchIssuesAcrossRepos` en `service.ts`:
   ```ts
   async searchIssuesAcrossRepos(userId, opts: {
     type: "pr" | "issue";
     state?: "open" | "closed";
     scope?: "author" | "assignee" | "mentions";
     org?: string;
     page?: number;
   })
   ```
   Usa `rest.search.issuesAndPullRequests({ q, per_page: 30, page })`. Construye `q` con `is:{type}` + estado + scope + filtro org cuando aplique. TTL 60s, resource key `search-issues`.
3. Crear `/pulls/page.tsx`:
   - Suspense + `PageHeader`.
   - Filtros: state (Tabs open/closed), scope (author/assignee/mentions).
   - `PaginationNav` reutilizado.
   - Render `PullRow`: title, repo full_name, número, estado, autor, fecha relativa.
4. Crear `/issues/page.tsx` análogo (icon `CircleAlert`).
5. Actualizar `dashboard/page.tsx`: agregar `href` a los 4 KPIs.
6. Verificar build: `pnpm build`.

## Todo

- [ ] StatCard `href` prop
- [ ] Service `searchIssuesAcrossRepos`
- [ ] `/pulls` page + row
- [ ] `/issues` page + row
- [ ] KPIs linkeados
- [ ] Build OK

## Criterio éxito

- Click en cada KPI navega a vista correcta.
- `/pulls` y `/issues` listan al menos 1 página de items reales del contexto activo.
- Cache Redis registra `search-issues:{userId}:{hash}`.

## Riesgos

- Search API 422 si query mal armado → validar `q` con Zod.
- Org context: search no soporta privacy filter; mostrar disclaimer si org tiene repos privados sin acceso.

## Seguridad

- No exponer query crudo al cliente.
- Server-only via service. Mantener `userId` desde session.

## Siguiente

Fase 02.
