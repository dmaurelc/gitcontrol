---
status: in-progress
created: 2026-05-16
project: gitcontrol-vercel-neon-staging
branch: feature/vercel-neon-staging
blockedBy: []
blocks: []
---

# Vercel + Neon Staging — Plan

Deploy paralelo a Vercel + Neon para prelanzamiento de testers (5-20 users), manteniendo Dokploy intacto en `develop`/`main`. Branch nueva: `feature/vercel-neon-staging`.

## Objetivo

- App corriendo en Vercel Hobby con DB Neon free.
- GitHub OAuth App separada (staging) → no toca prod.
- Cero impacto en deploy Dokploy actual.
- Drivers serverless-friendly (no TCP pools persistentes).
- Migraciones automáticas en build de Vercel.

## Decisiones tomadas

1. **Driver DB dual** → mantener `node-postgres` para Dokploy + agregar `@neondatabase/serverless` (websocket pool drop-in compatible con `node-postgres`). Selección por env var `DB_DRIVER` o auto-detect Vercel.
2. **Redis fase 1 deshabilitado** → feature flag `CACHE_ENABLED=false`. Pass-through directo GitHub. No tocar 5 archivos consumidores, gate en `getRedis()`.
3. **Dominio** → `gitcontrol-staging.vercel.app` (default Vercel). Custom domain opcional fase 5.

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 01 | Setup cuentas + Vercel project + Neon DB + OAuth App staging | pending | [phase-01-setup-infra.md](phase-01-setup-infra.md) |
| 02 | Driver DB dual: neon-serverless + selector | pending | [phase-02-db-driver-swap.md](phase-02-db-driver-swap.md) |
| 03 | Cache opcional (feature flag CACHE_ENABLED) | pending | [phase-03-cache-toggle.md](phase-03-cache-toggle.md) |
| 04 | Migraciones en vercel-build + env schema | pending | [phase-04-migrations-env.md](phase-04-migrations-env.md) |
| 05 | Runtime nodejs + sync background (waitUntil) | pending | [phase-05-runtime-checks.md](phase-05-runtime-checks.md) |
| 06 | Deploy + smoke test + docs | pending | [phase-06-deploy-docs.md](phase-06-deploy-docs.md) |

## Out of scope

- Migración total (eliminar Dokploy). Solo paralelo.
- Upstash Redis (fase futura si testers reportan latencia).
- Custom domain (post-validación testers).
- Vercel Cron para sync periódico (post-MVP staging).

## Restricciones

- **NO romper Dokploy**: branch develop/main siguen con `pg` + `ioredis`.
- **NO tocar Dockerfile / docker-compose.dev.yml / scripts/entrypoint.sh**.
- **Reusar schema Drizzle**: mismo SQL, distinto driver.
- **Secrets separados**: `TOKEN_ENCRYPTION_KEY` y `BETTER_AUTH_SECRET` distintos prod/staging.

## Dependencias técnicas

- `@neondatabase/serverless` (websocket pool, API-compatible con `pg.Pool`)
- `drizzle-orm/neon-serverless` (ya viene con drizzle-orm 0.45.2)
- Vercel CLI local opcional para testing
- Neon CLI opcional

## Preguntas abiertas resueltas

- ✅ Dual driver vía env var (no swap total).
- ✅ Cache toggle feature flag (no comentar código).
- ✅ Subdomain `.vercel.app` para testers (custom domain después).

## Build order

Fase 01 (setup infra) → 02 (driver) y 03 (cache) en paralelo → 04 (migrations/env) → 05 (runtime) → 06 (deploy + docs).

Total estimado: 1 día efectivo (sin contar tiempo de espera entre deploys).
