# Fase 04 — Activity cap a 6 + links por evento + vista "View all"

## Contexto

`ActivityFeed` (`src/components/activity-feed.tsx`) hoy:
- Pide 10 eventos (`listViewerEvents(userId, 10)`).
- Renderiza items NO clickeables.
- Sin link "ver todo".

Pedido:
- Limitar a 6.
- Cada item linkea a su issue/PR/commit (cuando aplique).
- Footer "View all activity" → `/activity` (vista nueva).

## Insights

GitHub Events API expone `payload` con datos suficientes para construir URL interna:

| Event type | Internal route |
|------------|----------------|
| `PushEvent` | `/repositories/{repo}` (no hay vista commit propia) |
| `PullRequestEvent` | `/repositories/{repo}/pulls/{number}` |
| `PullRequestReviewEvent` | `/repositories/{repo}/pulls/{number}` |
| `PullRequestReviewCommentEvent` | idem |
| `IssuesEvent` | `/repositories/{repo}/issues/{number}` |
| `IssueCommentEvent` | issue o PR según `payload.issue.pull_request` |
| `WatchEvent` (star) | `/repositories/{repo}` |
| `CreateEvent` / `ForkEvent` | `/repositories/{repo}` |
| default | `/repositories/{repo}` |

`event.repo.name` viene como `"owner/repo"`.

## Archivos

- `src/components/activity-feed.tsx` — refactor: derivar `href`, aceptar `limit?: number`, opcional `showFooter?: boolean`.
- `src/app/(dashboard)/dashboard/page.tsx` — pasar `limit={6}` + footer link.
- `src/app/(dashboard)/activity/page.tsx` — vista nueva.

## Pasos

1. Añadir `eventHref(event)` en `activity-feed.tsx` que devuelve string internal o null.
2. Agregar props `limit?: number` (default 6) y `footer?: React.ReactNode`.
3. Wrappear cada `<li>` con `<Link href={href}>` cuando exista; si no, dejar `<div>`.
4. En `dashboard/page.tsx`:
   - Pasar `<ActivityFeed userId={...} limit={6} />`.
   - En el `<CardHeader>` de Activity agregar link "View all" → `/activity` (mismo patrón que RecentRepos).
5. Extender `listViewerEvents` en service: agregar `page` param. Endpoint REST `activity.listEventsForAuthenticatedUser` soporta `page` y `per_page` (max 100, hasta 10 pages = 300 events).
6. Crear `/activity/page.tsx`:
   - `PageHeader` "Activity".
   - `searchParams.page` (default 1).
   - `<ActivityFeed userId={...} limit={30} page={page} />`.
   - `PaginationNav` reutilizado. Total pages = 10 (límite GitHub).
   - Empty state si no events.

## Todo

- [ ] Helper `eventHref`
- [ ] Props `limit` + `page` en `ActivityFeed`
- [ ] `<Link>` por evento
- [ ] Service `listViewerEvents` acepta `page`
- [ ] Footer "View all" en card del dashboard
- [ ] `/activity/page.tsx` con paginación
- [ ] Build OK

## Criterio éxito

- Dashboard muestra 6 eventos.
- Click en evento PR/issue navega a la página correcta.
- Link "View all" abre `/activity` con la lista extendida.

## Riesgos

- Events API sin scope adecuado → empty state. Ya manejado.
- Some payloads sin `number` → fallback a repo route.

## Notas

- Paginación: usuario confirmó incluir ahora.
