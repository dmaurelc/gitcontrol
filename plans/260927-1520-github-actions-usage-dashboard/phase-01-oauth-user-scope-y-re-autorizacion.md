---
phase: 1
title: "OAuth user scope y re-autorizacion"
status: completed
priority: P1
effort: "3h"
dependencies: []
---

# Phase 1: OAuth user scope y re-autorización

## Overview
Permitir el acceso a billing mediante un flujo opt-in que concede el scope `user` sin perder sesión.

## Requirements
- Functional: el login **no** pide `user`; el CTA "Grant billing access" concede el scope bajo demanda.
- Non-functional: sin logout forzado; resto del dashboard sigue funcionando sin el scope.

## Architecture
- `GITHUB_OAUTH_SCOPES` (`src/lib/auth/auth.ts`) se mantiene **sin** `user` (opt-in real). El scope se pide solo vía `linkSocial({ provider:"github", scopes:["user"] })`.
- Detección: columna `account.scope` (`src/lib/db/schema.ts:72`) → helper `hasGithubScope(userId, "user")`. Fallback: header `x-oauth-scopes` de cualquier respuesta Octokit.
- Re-auth: better-auth `authClient.linkSocial({ provider: "github", scopes: [...] })` o `signIn.social` con `callbackURL` de vuelta a la página actual. Verificar que better-auth 1.7 actualiza `account.scope`/token al re-vincular misma cuenta.

## Related Code Files
- Modify: `src/lib/auth/auth.ts`
- Create: `src/lib/auth/github-scope-check.ts` (hasGithubScope)
- Create: `src/components/grant-github-scope-button.tsx` (client, llama linkSocial)

## Implementation Steps
1. **No** añadir `"user"` a `GITHUB_OAUTH_SCOPES` (decisión opt-in, 2026-09-28).
2. Implementar `hasGithubScope` leyendo `account.scope` (split por `,`/espacio).
3. Botón cliente de re-autorización con callback a URL actual.
4. Probar local: usuario existente → botón → GitHub consent → vuelve con scope actualizado en DB.

## Success Criteria
- [x] El login NO incluye `user` en `GITHUB_OAUTH_SCOPES` (opt-in).
- [x] El CTA concede `user` vía `linkSocial` sin logout y `hasGithubScope` pasa a true.

## Risk Assessment
- better-auth podría no refrescar el token al re-link de la misma cuenta → fallback: `signIn.social` completo (re-login transparente).
- Scope `user` es de escritura sobre perfil → documentar en settings/privacidad que solo se usa lectura.
