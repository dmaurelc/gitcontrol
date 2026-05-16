# Phase 01 — Setup Infra (Vercel + Neon + OAuth staging)

**Priority:** P0 (bloquea todo lo demás)
**Status:** pending
**Estimated effort:** 30-45 min (sin código)

## Overview

Crear cuentas/proyectos en Vercel y Neon, registrar GitHub OAuth App staging, generar secretos staging. No toca código.

## Tasks

1. **Neon**
   - Crear cuenta en `https://neon.tech` (free tier).
   - Crear proyecto `gitcontrol-staging`, región más cercana (us-east o sa-east si disponible).
   - Anotar:
     - `DATABASE_URL` (pooled, format `postgres://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require`)
     - `DATABASE_URL_UNPOOLED` (direct, sin `-pooler`) — usado por migraciones.
   - Verificar branch `main` creada por defecto. Opcional: branch `dev` para testing local.

2. **Vercel**
   - Crear cuenta en `https://vercel.com` (Hobby).
   - **NO importar repo todavía** (se hace en phase 06 cuando código está listo).
   - Tomar nota del dominio default que asignará: `gitcontrol-staging.vercel.app` (o similar).

3. **GitHub OAuth App staging**
   - `https://github.com/settings/developers` → "New OAuth App".
   - Name: `GitControl Staging`
   - Homepage URL: `https://gitcontrol-staging.vercel.app` (placeholder, ajustar tras phase 06).
   - Authorization callback URL: `https://gitcontrol-staging.vercel.app/api/auth/callback/github`
   - Generar `CLIENT_ID` + `CLIENT_SECRET`. Guardar.

4. **Secretos staging**
   ```sh
   openssl rand -hex 32       # TOKEN_ENCRYPTION_KEY (64 chars hex)
   openssl rand -base64 32    # BETTER_AUTH_SECRET (>=32 chars)
   ```
   Guardar en password manager. **No commitear**.

## Acceptance criteria

- [ ] Proyecto Neon creado, `DATABASE_URL` y `DATABASE_URL_UNPOOLED` capturados.
- [ ] Cuenta Vercel lista (no proyecto aún).
- [ ] GitHub OAuth App staging con `CLIENT_ID` + `CLIENT_SECRET`.
- [ ] Secretos generados (`TOKEN_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`) distintos a producción.
- [ ] Lista de env vars completa anotada en password manager.

## Risks

- Neon free auto-suspend tras 5min → cold start primer query. Aceptado para staging.
- Dominio Vercel exacto se confirma al crear proyecto en phase 06 → puede requerir actualizar callback URL OAuth.

## Notes

- NO tocar OAuth App de producción.
- NO usar mismo `TOKEN_ENCRYPTION_KEY` que prod — encryptions independientes.
