# Phase 06 — Deploy Vercel + smoke test + docs

**Priority:** P0
**Status:** pending
**Estimated effort:** 1h
**Depends on:** phase-01..05

## Overview

Importar repo a Vercel desde branch `feature/vercel-neon-staging`. Configurar env vars. Deploy. Smoke test. Actualizar docs.

## Tasks

### 1. Push branch a GitHub

```sh
git push -u origin feature/vercel-neon-staging
```

### 2. Import repo en Vercel

- Vercel dashboard → "Add New Project" → Import from GitHub.
- Seleccionar repo `gitcontrol`.
- **Production branch:** `feature/vercel-neon-staging` (override default `main`).
- Framework preset: Next.js (auto-detect).
- Build command: dejar default → usa `vercel-build` script automáticamente.
- Output directory: default (`.next`).
- Install command: `pnpm install` (auto-detect por `pnpm-lock.yaml`).

### 3. Set env vars en Vercel

Settings → Environment Variables. Aplicar todas a "Production" (Vercel trata production branch como prod aunque sea staging branch).

| Var | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon pooled |
| `MIGRATION_DATABASE_URL` | Neon unpooled |
| `DB_DRIVER` | `neon` |
| `CACHE_ENABLED` | `false` |
| `GITHUB_CLIENT_ID` | staging |
| `GITHUB_CLIENT_SECRET` | staging |
| `TOKEN_ENCRYPTION_KEY` | staging (64-hex) |
| `BETTER_AUTH_SECRET` | staging (>=32) |
| `BETTER_AUTH_URL` | dominio Vercel asignado |

### 4. Trigger first deploy

- Vercel construye automático al push o click "Deploy".
- Monitor build logs → buscar:
  - `[migrate] running migrations...`
  - `[migrate] done`
  - `Compiled successfully`
- Si falla migración: verificar `MIGRATION_DATABASE_URL` y permisos Neon.

### 5. Actualizar callback OAuth con dominio real

Tras primer deploy, Vercel asigna dominio. Si difiere de placeholder phase 01:
- GitHub OAuth App staging → editar callback: `https://<real-domain>/api/auth/callback/github`.
- Vercel env `BETTER_AUTH_URL` → actualizar al real.
- Redeploy.

### 6. Smoke test

1. `https://<domain>/api/health` → 200 `{db: "ok", redis: "disabled"}`.
2. `https://<domain>/login` → carga.
3. Click "Sign in with GitHub" → flow OAuth → redirect dashboard.
4. Query DB (Neon SQL Editor):
   ```sql
   SELECT id, "providerId", "accessToken" IS NULL AS plaintext_cleared,
          "encryptedAccessToken" IS NOT NULL AS has_encrypted
   FROM account;
   ```
   Esperado: `plaintext_cleared=true`, `has_encrypted=true`.
5. Dashboard carga repos, stars, issues, PRs sin errores en consola.
6. Open repo detail → verifica branches/commits/code explorer (si activado).

### 7. Update docs

Editar `docs/deployment-guide.md`:
- Mantener sección Dokploy existente.
- Agregar **sección nueva** "Vercel + Neon Staging Deploy":
  - Prerequisitos (cuentas, OAuth App staging).
  - Env vars table.
  - Steps import + deploy.
  - Smoke test checklist.
  - Limitaciones (cold start, 10s timeout, no Redis cache).

### 8. Invitar testers

- Compartir URL staging.
- Crear lista en password manager con OAuth App credentials staging para revocación rápida.
- Set GitHub issue template en repo para tester feedback (opcional, fuera de scope plan).

## Acceptance criteria

- [ ] Deploy Vercel exitoso (build verde).
- [ ] `/api/health` retorna 200.
- [ ] Sign-in OAuth completa.
- [ ] Tokens encriptados en DB Neon.
- [ ] Dashboard funcional con datos reales.
- [ ] `docs/deployment-guide.md` actualizado con sección Vercel.
- [ ] Dokploy `develop`/`main` no afectados (push branch staging no rompió otros builds).

## Risks

- **Build timeout Vercel**: build Next + migraciones puede acercarse a 45min límite Hobby. Improbable pero monitor.
- **Neon migration locks**: si hay sesiones activas durante migración, puede colgar. Aceptable primera vez (DB virgen).
- **OAuth callback mismatch**: dominio Vercel exacto desconocido hasta primer deploy → puede requerir 1-2 redeploys.

## Rollback

- En Vercel: "Deployments" → click deploy anterior → "Promote to Production".
- Neon: branches automáticos permiten reset.
- Branch staging: no merge a develop/main → cero impacto si se abandona.

## Success criteria

- URL staging compartible con testers.
- Sign-in + dashboard funcionan end-to-end.
- Docs reflejan dual deploy (Dokploy prod + Vercel staging).
- Dokploy producción intacto.

## Post-deploy follow-ups (out of scope)

- Vercel Cron para sync periódico.
- Upstash Redis si testers reportan rate limits.
- Custom domain `staging.maureldev.com` o similar.
- Vercel Analytics / Speed Insights toggle.
