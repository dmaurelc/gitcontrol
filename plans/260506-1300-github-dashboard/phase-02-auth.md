# Phase 02 — Authentication

## Context Links
- [plan.md](plan.md) · [phase-01-setup.md](phase-01-setup.md)

## Overview
- **Priority**: P0
- **Status**: pending
- Better Auth con provider GitHub OAuth. Persistencia de access tokens cifrados (AES-256-GCM). Sesiones cookie httpOnly. Aislamiento por user_id.

## Key Insights
- Better Auth tiene plugin oficial para GitHub OAuth
- GitHub access tokens (no expiran salvo refresh) deben encriptarse en reposo
- Scopes mínimos para MVP: `read:user user:email repo read:org read:packages read:project`
- Cookie sameSite=lax para que el OAuth callback funcione

## Requirements
**Funcionales**
- Login con GitHub redirige y crea sesión
- Logout destruye sesión
- Middleware protege `/dashboard/*`
- Token de GitHub recuperable (descifrado) en server actions

**No funcionales**
- Tokens nunca llegan al cliente
- CSRF protegido (Better Auth lo maneja)

## Architecture
```
[Browser] → /login → /api/auth/[...all] (Better Auth)
                          ↓ OAuth dance
                       GitHub
                          ↓ callback
                    Better Auth handlers
                          ↓
                    Postgres (user, account, session)
                    + cifrado access_token

[Server Action] → getSession() → getDecryptedToken(userId) → Octokit
```

## Related Code Files
**Crear**
- `src/lib/auth/auth.ts` — Better Auth config
- `src/lib/auth/encryption.ts` — AES-256-GCM helpers
- `src/lib/auth/get-github-token.ts` — token retrieval helper
- `src/app/api/auth/[...all]/route.ts` — handler
- `src/app/login/page.tsx`
- `src/middleware.ts` — protege rutas
- `src/lib/db/schema.ts` — añadir tablas user, account, session, verification

## Implementation Steps
1. Instalar `better-auth`
2. Definir schema Drizzle con tablas Better Auth + columna `account.access_token_encrypted` (text) y `account.iv` (text)
3. `pnpm drizzle-kit generate` + `migrate`
4. `src/lib/auth/encryption.ts`: funciones `encrypt(plain)` → `{ciphertext, iv, tag}` JSON, `decrypt(payload)` usando `TOKEN_ENCRYPTION_KEY`
5. `src/lib/auth/auth.ts`: `betterAuth({ database: drizzleAdapter, socialProviders: { github: { clientId, clientSecret, scope: [...] } }, hooks })` — hook `after` en signIn que cifra el access_token antes de guardar
6. `route.ts` con `auth.handler`
7. `middleware.ts`: redirige a `/login` si no hay sesión y path empieza con `/dashboard`, `/repositories`, `/stars`, etc.
8. `src/app/login/page.tsx`: botón "Sign in with GitHub" usando shadcn Button
9. `getGithubToken(userId)`: query account + decrypt
10. Test manual: login → verifica cookie + token cifrado en DB
11. Commit: `feat(auth): GitHub OAuth via Better Auth with encrypted tokens`

## Todo List
- [ ] Instalar Better Auth
- [ ] Schema Drizzle con tablas auth + token cifrado
- [ ] Migration aplicada
- [ ] Encryption helpers + tests
- [ ] Better Auth config + GitHub provider
- [ ] Hook que cifra access_token
- [ ] Route handler `/api/auth/[...all]`
- [ ] Login page
- [ ] Middleware
- [ ] `getGithubToken` helper
- [ ] Smoke test E2E login flow

## Success Criteria
- Login GitHub completa OAuth y aterriza en `/dashboard`
- Tabla `account` muestra token cifrado (no plaintext)
- `getGithubToken(userId)` retorna token usable con Octokit
- Logout limpia sesión

## Risk Assessment
- **Better Auth API cambios**: pinear versión exacta
- **Cifrado mal implementado**: usar `node:crypto` `createCipheriv` con AES-256-GCM, IV de 12 bytes random por token, guardar IV+authTag
- **OAuth callback URL**: configurar correcta en GitHub OAuth App (`https://<dominio>/api/auth/callback/github`)

## Security Considerations
- `TOKEN_ENCRYPTION_KEY` rotable (futuro: re-encrypt batch)
- IV único por token (nunca reusar)
- Cookies: `httpOnly`, `secure` en prod, `sameSite=lax`
- Logs nunca incluyen token plaintext
- Rate limit en `/login` futuro

## Next Steps
→ Phase 03: GitHubService usando token desencriptado
