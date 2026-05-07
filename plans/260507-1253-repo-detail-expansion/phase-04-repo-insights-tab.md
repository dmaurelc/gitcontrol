# Fase 04 — Repo tab Insights (traffic + commit activity)

## Contexto

Pedido: tab "Insights" en repo detail si está disponible/visible. GitHub Insights expone:
- Traffic: views (14 días), clones (14 días), referrers, popular content. Requiere `push` permission.
- Commit activity: últimos 52 weeks de commits — público.
- Code frequency: additions/deletions weekly — público.
- Contributors stats — público (ya parcialmente cubierto en aside).

## Decisión

Tab "Insights" SIEMPRE visible (puerta de entrada a stats). Bloques condicionales según permisos:
- **Commit activity** (público): chart de barras 52 semanas.
- **Traffic** (push permission): views + clones de 14 días. Si 403 → bloque oculto/disclaimer.
- **Code frequency** (público): chart additions vs deletions.

Nada de "ocultar tab según permission" — UX más predecible.

## Insights

Endpoints REST:
- `repos.getCommitActivityStats({ owner, repo })` — array of 52 weeks `{ days: number[7], total, week: epoch }`.
- `repos.getCodeFrequencyStats({ owner, repo })` — array `[week, additions, deletions]`.
- `repos.getViews({ owner, repo, per: "day" })` — `{ count, uniques, views: [{ timestamp, count, uniques }] }`.
- `repos.getClones({ owner, repo, per: "day" })` — same shape.

GitHub stats endpoints pueden devolver 202 (computing) → reintentar o renderear "Stats are being computed, refresh in a moment".

Recharts ya en deps (visto en `contributions-chart.tsx`). Reutilizar.

## Archivos

### Modificar

- `src/lib/github/service.ts` — `getCommitActivity`, `getCodeFrequency`, `getRepoTraffic` (combina views+clones).
- `src/app/(dashboard)/repositories/_components/repo-tabs-nav.tsx` — agregar tab Insights.

### Crear

- `src/app/(dashboard)/repositories/[owner]/[repo]/insights/page.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/insights/_components/commit-activity-chart.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/insights/_components/code-frequency-chart.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/insights/_components/traffic-chart.tsx`

## Pasos

1. Service:
   ```ts
   async getCommitActivity(userId, owner, repo) {
     // cachedFetch resource "commit-activity", TTL 3600s
     // handle 202 status: return { computing: true }
   }
   async getCodeFrequency(userId, owner, repo) {
     // resource "code-frequency", TTL 3600s
   }
   async getRepoTraffic(userId, owner, repo) {
     // Promise.allSettled(getViews, getClones)
     // returns { views?, clones?, restricted: boolean }
     // resource "traffic", TTL 600s
   }
   ```
2. `insights/page.tsx`:
   - Layout 1 columna mobile, 2 columnas md+.
   - Suspense por bloque (independientes).
   - Empty / computing / restricted states.
3. Charts client (`"use client"`):
   - Bar chart Recharts con `ChartContainer` shadcn si existe (revisar `contributions-chart.tsx` por patrón).
   - Tooltip con fecha + valor.
4. Tabs nav: agregar `{ href: \`${base}/insights\`, label: "Insights" }`.

## Todo

- [ ] Service `getCommitActivity`
- [ ] Service `getCodeFrequency`
- [ ] Service `getRepoTraffic`
- [ ] Page `/insights`
- [ ] CommitActivityChart
- [ ] CodeFrequencyChart
- [ ] TrafficChart (con state "restricted")
- [ ] Tab "Insights" en repo nav
- [ ] Build OK

## Criterio éxito

- `/repositories/{owner}/{repo}/insights` muestra commit activity 52w + code freq + traffic 14d.
- Si traffic 403 → bloque con mensaje "Requires push permission".
- Si stats 202 → mensaje "Computing, try again shortly".

## Riesgos

- 202 status: Octokit lo entrega como `status === 202` con body vacío. Manejar.
- Charts complicados de stylar consistentes con `chart-1..5` tokens. Reusar `ChartContainer` existente.
- Performance: 4 requests paralelos al cargar tab. Cache existente mitiga después del primer hit.

## Pregunta abierta

- ¿Mostrar referrers + popular content de traffic? Útil pero más superficie. Decidir tras feedback fase 04 inicial. (Default: NO en MVP de esta fase.)
