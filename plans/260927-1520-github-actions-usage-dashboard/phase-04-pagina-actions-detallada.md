---
phase: 4
title: "Pagina actions detallada"
status: completed
priority: P2
effort: "1d"
dependencies: [2]
---

# Phase 4: Página `/actions`

## Overview
Vista detallada del uso de Actions del contexto activo.

## Requirements
Secciones:
1. Resumen: minutos usados/incluidos, costo neto, días restantes del ciclo, proyección fin de mes (lineal).
2. Top repos por minutos (billing `byRepo`) — tabla con barra relativa.
3. Repos más activos: nº runs mes, success rate, duración media (runs).
4. Workflows más lentos / con más fallos.
5. Runs fallidos recientes (link al run existente en `/repositories/[owner]/[repo]/...`).

## Architecture
- Actividad: nuevo `src/lib/github/actions-activity-stats.ts`.
  - Candidatos: top N=15 repos por `pushed_at` del contexto (reusar listado de repos existente) ∪ repos con minutos en billing.
  - Por repo: `listWorkflowRunsForRepo({ created: ">=YYYY-MM-01", per_page: 100 })`, máx 2 páginas. Duración = `updated_at - run_started_at` (evita N llamadas a `/timing`).
  - Concurrencia limitada (helper propio `mapLimit`, sin `p-limit`) + `cachedFetch` TTL 10 min.
  - Nota implementación: rango de fechas acotado (`created=YYYY-MM-DD..YYYY-MM-DD`) + filtro ISO
    por cotas inferior/superior, para que un mes pasado no filtre runs de meses posteriores.
- Filtro de periodo: mes actual / mes anterior (`?month=`).
- Añadir entrada "Actions" en `app-sidebar.tsx` y `command-palette.tsx`.

## Related Code Files
- Create: `src/app/(dashboard)/actions/page.tsx`, `src/app/(dashboard)/actions/_components/*`
- Create: `src/lib/github/actions-activity-stats.ts`
- Modify: `src/app/(dashboard)/_components/app-sidebar.tsx`, `src/components/command-palette.tsx`

## Implementation Steps
1. Servicio de stats de actividad.
2. Página con Suspense por sección.
3. Tablas/gráficos (reusar estilo de `contributions-chart`).
4. Nav + command palette.

## Success Criteria
- [ ] Página carga < 3s con caché caliente.
- [ ] Consumo de rate limit por carga fría < 50 requests.

## Risk Assessment
- Repos con miles de runs → cap de páginas; mostrar "≥ N" si se trunca.
