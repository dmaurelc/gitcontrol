---
phase: 5
title: "Rollup diario y tendencia"
status: completed
priority: P3
effort: "4h"
dependencies: [2, 4]
---

# Phase 5: Rollup diario + tendencia

## Overview
Persistir minutos diarios para mostrar tendencia e histórico sin re-consultar GitHub.

## Architecture
- Tabla `actions_usage_daily`: `(context_login, context_kind, date, repo, sku)` PK compuesta; `minutes`, `net_amount`, `updated_at`.
- La billing API admite `day=` → al cargar `/actions`, upsert (`onConflictDoUpdate`) de los días del mes actual (lazy, sin cron). Días pasados se consideran estables tras 48h.
- Gráfico de línea/barras diarias en `/actions` + comparativa mes anterior.

## Related Code Files
- Modify: `src/lib/db/schema.ts`
- Create: migración `drizzle/0005_actions_usage_daily.sql` (drizzle-kit generate)
- Create: `src/lib/github/actions-usage-rollup.ts`
- Create: `src/app/(dashboard)/actions/_components/actions-usage-trend-chart.tsx`

## Implementation Steps
1. Schema + migración.
2. Sync lazy con throttle (Redis lock por contexto, 1 sync/15 min).
3. Chart de tendencia.

## Success Criteria
- [x] Tendencia del mes visible; segunda carga no llama a billing (caché 15 min).

## Implementación (2026-09-28) — alcance reducido (YAGNI)
Se aplicó la salida prevista en el riesgo: la API de billing devuelve `date` en cada
`usageItem`, así que la tendencia diaria se deriva **en la misma llamada** de fase 2.
- **No** se creó tabla `actions_usage_daily`, ni migración, ni lock Redis, ni sync lazy.
- La tendencia vive en `usage.byDay` (parse puro en `actions-billing-parse.ts`) y se
  renderiza con `actions-usage-trend-chart.tsx` (recharts `BarChart`).
- Si en el futuro se necesita histórico multi-mes, reabrir esta fase.
