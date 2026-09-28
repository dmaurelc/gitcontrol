---
title: "GitHub Actions usage dashboard"
description: "Uso de GitHub Actions (minutos del mes, ranking por repo, actividad y tendencia) para cuenta personal y orgs"
status: completed
priority: P2
branch: "develop"
tags: [github-actions, billing, dashboard, oauth]
blockedBy: []
blocks: []
created: "2026-09-28T02:23:38.620Z"
createdBy: "ck:plan"
source: skill
---

# GitHub Actions usage dashboard

## Overview

Mostrar uso de GitHub Actions: widget en `/dashboard` (minutos usados/incluidos del mes, desglose por OS) y página `/actions` (top repos por minutos, repos más activos, success rate, workflows lentos/fallidos, tendencia diaria). Soporta cuenta personal y orgs según el contexto activo (`src/lib/context/active-context.ts`).

## Decisiones confirmadas (usuario, 2026-09-27)
- Añadir scope OAuth `user` → requiere re-autorización de usuarios existentes.
- Incluir uso de organizaciones (degradar si no es admin/billing manager).

## Fuentes de datos
- Billing (minutos, costo, por repo): `GET /users/{u}/settings/billing/usage` · `GET /organizations/{org}/settings/billing/usage` (enhanced billing platform). Solo repos privados en GitHub-hosted runners.
- Actividad (runs, éxito, duración): `rest.actions.listWorkflowRunsForRepo` (ya usado en `service.ts:1671`). Cubre repos públicos.
- Cuota incluida: no viene en API → mapa por plan (`GET /user` o `/orgs/{org}` → `plan.name`).

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [OAuth user scope y re-autorizacion](./phase-01-oauth-user-scope-y-re-autorizacion.md) | Completed |
| 2 | [Billing service Actions usage](./phase-02-billing-service-actions-usage.md) | Completed |
| 3 | [Widget minutos en home](./phase-03-widget-minutos-en-home.md) | Completed |
| 4 | [Pagina actions detallada](./phase-04-pagina-actions-detallada.md) | Completed |
| 5 | [Rollup diario y tendencia](./phase-05-rollup-diario-y-tendencia.md) | Completed |
| 6 | [Tests y docs](./phase-06-tests-y-docs.md) | Completed |

## Dependencies

Ninguna. Planes abiertos (`260512` landing, `260515` code explorer, `260516` neon staging) no tocan auth scopes ni dashboard home.

## Riesgos clave
- Re-auth masiva al cambiar scopes → banner opt-in, no logout forzado.
- Rate limit al recorrer runs de muchos repos → top N + caché Redis + rollup diario.
- Forma exacta de la respuesta billing puede variar → validar con llamada real antes de tipar (fase 2 paso 1).

## Preguntas abiertas
- Cuota Pro/Team/Enterprise exacta a confirmar contra docs actuales al implementar.

## Implementación (2026-09-28)

**Archivos nuevos**
- `src/lib/auth/github-scopes.ts` + `github-scope-check.ts` (parse + `hasGithubScope(userId,"user")`)
- `src/components/grant-github-scope-button.tsx` (re-auth vía `linkSocial`)
- `src/lib/github/actions-billing-parse.ts` (parse/agregación pura) · `actions-billing-usage.ts` (server)
- `src/lib/github/actions-included-minutes.ts` (mapa plan → minutos)
- `src/lib/github/actions-activity-parse.ts` (stats puras) · `actions-activity-stats.ts` (server)
- `src/components/actions-usage-card.tsx` (widget) + `src/app/(dashboard)/actions/**`
- Tests: `*.test.ts` colocalizados (4 archivos, 21 tests)

**Cambios**
- `src/lib/auth/auth.ts`: scopes de login **sin** `user` (el acceso a billing es opt-in).
- `src/lib/github/service.ts`: `ListWorkflowRunsOpts.created` + `WorkflowRun.run_started_at`.
- `src/app/(dashboard)/dashboard/page.tsx`: widget en Suspense.
- Sidebar + command palette: entrada "Actions usage".
- `package.json`: scripts `typecheck` y `test` (runner nativo de Node, sin deps nuevas).
- `tsconfig.json`: `allowImportingTsExtensions` (para imports `.ts` en tests).
- Docs: `system-architecture.md` (§3, §5b nueva, failure modes), `README.md`.

**Decisiones**
- Fase 5 sin tabla DB: tendencia derivada de `byDay` de la API de billing (YAGNI).
- Concurrencia propia (`mapLimit`) en vez de `p-limit` → cero dependencias nuevas.
- Re-auth con `linkSocial` (no `signIn.social`): Better Auth confirma que solo `linkSocial`
  hace merge de scopes en `account.scope`.
- **Opt-in real de seguridad**: `user` (scope de escritura de perfil) NO se pide en el login;
  se concede solo al pulsar el CTA, vía `linkSocial({ scopes:["user"] })`. Mínimo privilegio:
  la actividad (runs/éxito/duración) funciona sin ningún scope nuevo.

**Verificación**
- ✅ `tsc --noEmit`, `next build` (ruta `ƒ /actions` presente), 21/21 tests.
- ⚠️ `pnpm lint` falla por 4 errores **pre-existentes** en `src/lib/db/client.ts`
  (`no-require-imports`), ajenos a este plan. Todos los archivos nuevos pasan ESLint.
- ⚠️ Pendiente verificación con token real: forma exacta de `usageItems` (fase 2 paso 1),
  minutos vs. página de Billing de GitHub, y flujo `linkSocial` en preview (usuario con/sin scope).
