# Phase 05 — Deploy Update (Dokploy)

## Priority: HIGH
## Status: pending
## Estimated: 30 min

## Overview

Update Dokploy app config con nuevo repo URL. Redeploy. Verificar webhooks.

## Pre-conditions

- ✅ Phase 04 GitHub rename completed
- ✅ Code en main actualizado

## Steps

### 1. Update Dokploy Git Provider Config

Dokploy UI:
- App: maureldev (renombrar a "gitcontrol")
- Git Provider → Repository: `dmaurelc/gitcontrol` (era `maureldev`)
- Branch: `main` (sin cambio)
- Save

### 2. Update App Name (opcional)

- Dokploy app name: "maureldev" → "gitcontrol"
- Service container names si aplica

### 3. Update Webhooks

Crítico: `.github/workflows/release.yml` usa `RELEASE_WEBHOOK_URL` env var apuntando a Dokploy endpoint.

- Verificar `RELEASE_WEBHOOK_URL` en GitHub repo secrets (puede tener UUID, no nombre)
- Si URL cambió por rename de app Dokploy → update GitHub secret

### 4. Redeploy

```
Dokploy → Application → Redeploy
```

Esperar build completo. Verificar logs.

### 5. Verificar prod

- [ ] `https://dev.webkode.cl` carga
- [ ] Login funciona
- [ ] Sidebar muestra "GitControl"
- [ ] Tab title "GitControl — GitHub Dashboard"
- [ ] Changelog carga (lee del repo nuevo via UPSTREAM_REPO)
- [ ] Bug report creates issue en `dmaurelc/gitcontrol`

### 6. Verificar release webhook

- Crear release dummy en GitHub (`v0.9.1-test`)
- Verificar cache changelog invalida
- Si OK → eliminar release dummy

## DB Production

**Decisión Phase 03**: si DB prod usa nombre `maureldev`, NO migrar en este sprint. Solo verificar:

- `DATABASE_URL` env var en Dokploy apunta correctamente
- App conecta DB sin error
- Migrations no se re-corren

## Validation

- [ ] Prod app responde
- [ ] Login OAuth funciona end-to-end
- [ ] Webhooks funcionando (release + bug report)
- [ ] Sin errores en logs Dokploy
- [ ] DB queries normales

## Rollback Plan

Si prod rompe:
1. Dokploy → revert deploy to previous version
2. Re-investigate causa antes de re-deploy

## Next Phase

→ Phase 06: OAuth rename (cosmético)
