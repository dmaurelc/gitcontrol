---
phase: 2
title: "Billing service Actions usage"
status: completed
priority: P1
effort: "4h"
dependencies: [1]
---

# Phase 2: Servicio de uso de Actions (billing)

## Overview
Módulo servidor que obtiene y agrega el uso de Actions del mes para usuario u org.

## Requirements
- Functional: `getActionsUsage(userId, ctx, month)` → `{ usedMinutes, includedMinutes, byOs[], byRepo[], netAmount, status }`.
- `status`: `ok | missing_scope | forbidden_org | unavailable` (nunca lanza al UI).
- Non-functional: caché Redis vía `cachedFetch` (TTL ~15 min); 1 llamada por contexto/mes.

## Architecture
- Endpoint: user → `GET /users/{login}/settings/billing/usage?year=&month=`; org → `GET /organizations/{org}/settings/billing/usage?...`. Llamar con `octokit.request` (puede no tener método tipado).
- Filtrar `usageItems` por `product === "actions"` y `unitType === "Minutes"`; sumar `quantity` (ojo: minutos brutos vs multiplicadores OS — usar lo que la API reporte como cantidad facturable y documentarlo).
- Agrupar por `sku` (OS) y `repositoryName`.
- Cuota: `src/lib/github/actions-included-minutes.ts` con mapa `plan.name → minutos` (free 2000, pro 3000, team 3000, enterprise 50000 — confirmar). Plan vía `GET /user` / `GET /orgs/{org}` (`plan` solo visible a admins de org → si falta, `includedMinutes: null`).
- Errores: 403/404 → mapear con `mapGithubError` a status.

## Related Code Files
- Create: `src/lib/github/actions-billing-usage.ts` (no inflar `service.ts`, ya 2301 líneas)
- Create: `src/lib/github/actions-included-minutes.ts`
- Read: `src/lib/github/cache.ts`, `src/lib/github/errors.ts`, `src/lib/github/client.ts`

## Implementation Steps
1. Llamada real manual con token propio para capturar forma exacta de respuesta; tipar a partir de ella.
2. Implementar fetch + agregación + cuota.
3. Integrar `cachedFetch` con resource `actions-billing`.
4. Mapeo de errores a `status`.

## Success Criteria
- [ ] Devuelve minutos correctos vs página Billing de GitHub (±1 min).
- [ ] Org sin permisos → `forbidden_org`, sin excepción.
- [ ] Sin scope → `missing_scope`.

## Risk Assessment
- API billing cambió en 2025 (legacy `/settings/billing/actions` deprecado). Usar solo la nueva; si 404, `unavailable`.
