# Phase 06 — OAuth App Rename (Cosmético)

## Priority: LOW
## Status: pending
## Estimated: 10 min

## Overview

Renombrar OAuth apps en GitHub Settings. Callback URLs ya URL-based, sin cambio funcional. Client ID/Secret permanecen.

## Steps

### 1. GitHub OAuth App (Production)

```
github.com → Settings → Developer settings → OAuth Apps
App: "MaurelDev"
Edit:
- Application name: "GitControl"
- Homepage URL: https://dev.webkode.cl (sin cambio temporal)
- Description: "GitControl — Self-hosted GitHub dashboard"
- Authorization callback URL: https://dev.webkode.cl/api/auth/callback/github (SIN CAMBIO)
```

### 2. GitHub OAuth App (Local Dev)

```
App: "MaurelDev Local"
Edit:
- Application name: "GitControl Local"
- Homepage URL: http://localhost:3000 (sin cambio)
- Description: "GitControl local development"
- Authorization callback URL: http://localhost:3000/api/auth/callback/github (SIN CAMBIO)
```

### 3. Logo (opcional)

Si quieres logo nuevo, subir aquí. Sino, deja default.

## What NOT to Change

- ❌ Client ID — break login para todos los usuarios
- ❌ Client Secret — break login + require redeploy
- ❌ Callback URLs — URL-based, no name-based
- ❌ Required scopes

## Validation

- [ ] Login prod sigue funcionando
- [ ] Login local sigue funcionando
- [ ] User screen muestra "GitControl" cuando autoriza (consent screen)

## Next Phase

→ Phase 07: Verification end-to-end
