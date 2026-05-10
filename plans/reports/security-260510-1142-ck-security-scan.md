# Reporte de Auditoría de Seguridad — maureldev

- Fecha: 2026-05-10
- Branch: main · Commit base: f5be09a
- Alcance: `full` (todo `src/`, `scripts/`, configs, Dockerfile)
- Metodología: STRIDE + OWASP Top 10 + scan de secretos + `pnpm audit`
- Stack detectado: Next 16.2.5 (App Router), React 19, Better Auth 1.6.9, Drizzle 0.45.2, Postgres (pg), Redis (ioredis), GitHub OAuth (Octokit)

---

## Resumen

- Archivos escaneados: 154 TS/TSX + configs + Dockerfile + scripts
- Hallazgos totales: **0 críticos · 1 alto · 5 medios · 4 bajos · 3 info**
- Secretos hardcodeados: **ninguno**
- Vulnerabilidades de dependencias (`pnpm audit`): **0 críticas · 0 altas · 2 moderadas**
- `.env*` correctamente excluidos del repo (`.gitignore` línea 34, 44–46) y no presentes en historial git

Postura general: **buena**. La capa de auth está bien diseñada (tokens cifrados AES-256-GCM, validación zod en todas las server actions, escopes OAuth explícitos). Riesgo principal: **falta total de rate limiting** en endpoints autenticados y server actions, lo que abre puertas a abuso y DoS.

---

## Hallazgos

| # | Severidad | Categoría | Archivo:Línea | Descripción | Recomendación |
|---|-----------|-----------|---------------|-------------|---------------|
| 1 | Alto | DoS / A04 | `src/app/actions/*` (todos) y `src/app/api/auth/[...all]/route.ts` | Sin rate limiting en server actions ni en handler OAuth. Un actor autenticado puede invocar `createIssueAction`, `createBugReportAction`, `commentIssueAction`, `reRunWorkflowAction` y `revokeAccessAction` sin límite, agotando la cuota de la API de GitHub del usuario y degradando el servicio para todos (Redis y Postgres compartidos). El endpoint `/api/auth/[...all]` también queda sin rate limit, exponiéndose a abuso de OAuth callback. | Añadir rate limiting por `userId` (autenticadas) y por IP (públicas). Better Auth trae `rateLimit` config — habilitarlo. Para server actions, usar Redis (ya disponible) con un wrapper tipo `INCR + EXPIRE` o instalar `@upstash/ratelimit` adaptado a ioredis. |
| 2 | Medio | Info Disclosure / A09 | `src/app/api/health/route.ts:14,19` | El endpoint `/api/health` es **público** (no pasa por `proxy.ts` porque el matcher excluye `/api`) y devuelve mensajes de error crudos del driver de DB/Redis: `error: ${(e as Error).message}`. Eso puede filtrar nombres de host, puertos, versiones o estado interno. | Devolver solo `ok`/`error` sin el mensaje. Si quieres detalle, exponerlo solo cuando un header de auth interno esté presente. |
| 3 | Medio | Repudiation / A09 | Todo el código | No hay logging de eventos de seguridad: login/logout, fallos de auth, `revokeAccessAction` (borra el usuario completo), cambios de `userPreferences`, accesos a tokens. Solo se ve `console.error` en errores de Redis y Octokit. | Añadir un logger estructurado (pino) con eventos: `auth.login`, `auth.logout`, `auth.revoke`, `account.delete`. No loguear tokens ni headers de cookie. Persistir 90 días mínimo. |
| 4 | Medio | Tampering / A05 | `src/lib/env.ts:23-32` | `BUILD_PLACEHOLDER` define `TOKEN_ENCRYPTION_KEY = "0".repeat(64)` y `BETTER_AUTH_SECRET = "build_secret_placeholder_at_least_32_chars"` para no romper el build. Si por error `NEXT_PHASE` está mal seteado en producción (o un bug futuro hace que `isBuildPhase()` devuelva `true` en runtime), se cifrarían tokens con clave cero. | Endurecer `isBuildPhase()`: además del check de `NEXT_PHASE`, requerir explícitamente `process.env.NODE_ENV === "production" && !process.env.RUNTIME_OK` o usar un flag dedicado `NEXT_BUILD=1`. Idealmente, propagar el placeholder solo a las rutas que se evalúan en build, no globalmente. |
| 5 | Medio | DoS / A04 | `src/lib/github/service.ts:684-725` (`getContent`) | `getContent` no limita tamaño de archivo antes de cachear en Redis. Un repo con un blob de 100MB puede llenar Redis vía cache (clave `gh:userId:contents:*`) en una sola llamada. El cliente `FilePreview` filtra >1MB pero el servidor no. | Antes de `cachedFetch`, comprobar `res.data.size` y rechazar / no cachear si excede (e.g., 5MB). |
| 6 | Medio | Tampering / A03 | `src/app/actions/settings.ts:43, 60-64`, `src/app/actions/visibility.ts:37-43, 56-61, 76-82, 95-101`, `src/app/actions/view-mode.ts:33-43` | Server actions construyen JSONB SQL inyectando `JSON.stringify([fullName])` y nombres de scope dentro de `sql\`...\``. `fullName` y `login` se validan con regex antes (✓), pero `view-mode.ts:40` interpola `${parsed.scope}` dentro del template SQL via `\`{viewMode,${parsed.scope}}\`` — `parsed.scope` viene de un `z.enum`, así que es seguro **hoy**, pero la mezcla de `sql\`\`` + concatenación de strings es frágil; cualquier futura ampliación del enum sin re-validación introduce SQLi. | Usar parámetros bindeados (`${variable}` directo dentro de `sql\`\``) en lugar de concatenación de strings dentro del template. Drizzle soporta `sql.placeholder` y `sql.raw` debe evitarse. |
| 7 | Bajo | Spoofing / A01 | `src/proxy.ts:25` | Middleware solo comprueba presencia de `getSessionCookie(req)` — **no valida** la sesión contra DB. Es la práctica recomendada por Better Auth (validar en server components), pero un atacante con una cookie `better-auth.session_token` arbitraria pasa el middleware y solo es bloqueado al primer `auth.api.getSession()`. Si una página protegida olvidara llamar `getSession`, expondría su shell HTML. | Documentar que **toda** página/layout bajo prefijos protegidos debe llamar `auth.api.getSession`. Considerar añadir en `(dashboard)/layout.tsx` (ya lo hace, ✓) un check obligatorio. Auditar nuevas rutas. |
| 8 | Bajo | Info Disclosure / A09 | `src/lib/github/dependencies.ts:143,169` y otros `console.error` | `console.error` con el error completo de GitHub puede incluir tokens en headers (Octokit a veces incluye `authorization` en `error.response.config.headers`). Riesgo real es bajo porque Octokit suele redactarlos, pero sin un sanitizador explícito no hay garantía. | Antes de loguear, redactar `headers.authorization` y `headers.cookie`. |
| 9 | Bajo | DoS / A04 | `src/lib/auth/encryption.ts:37-48` | `decrypt` no limita el tamaño del `ciphertext` base64. Un row corrupto con 100MB de payload haría OOM al intentar decodificar. Bajo en práctica porque solo lo escribimos nosotros, pero defensa en profundidad. | Verificar `ciphertext.length < 10000` antes de Buffer.from. |
| 10 | Bajo | Crypto / A02 | `src/lib/auth/encryption.ts` | AES-256-GCM ✓, IV aleatorio ✓, authTag ✓. Falta **AAD** (additional authenticated data) — si tuvieras varios tipos de payload cifrados con la misma key, no hay binding criptográfico al contexto. Hoy es solo `accessToken` así que es OK. | Si añades más payloads cifrados, pasar `userId + "github_access_token"` como AAD (`cipher.setAAD()`). |
| 11 | Info | Dep | `node_modules/.../esbuild@0.18.20` (vía drizzle-kit) | GHSA-67mh-4wv8-2f99 (moderada, CVSS 5.3). Solo afecta dev server de esbuild — **no producción** porque `drizzle-kit` solo se ejecuta en build/migrations. | Aceptable. Vendrá parchada cuando drizzle-kit suba esbuild. |
| 12 | Info | Dep | `next@16.2.5 → postcss@8.4.31` | GHSA-qx2v-qp2m-jg93 (moderada, CVSS 6.1) — XSS vía `</style>` en stringify. No te afecta porque no parseas CSS de usuario y reemitos. | Aceptable. Esperar bump de Next. |
| 13 | Info | Headers | `next.config.ts` | No se configuran headers de seguridad: CSP, HSTS, X-Frame-Options, Referrer-Policy, X-Content-Type-Options. Next no los pone por defecto. | Añadir bloque `headers()` en `next.config.ts` con CSP estricto (`default-src 'self'`, `script-src 'self' 'unsafe-inline'` mínimo o nonce-based), HSTS, `Referrer-Policy: strict-origin-when-cross-origin`. |

---

## Cobertura STRIDE

| Categoría | Estado | Notas |
|-----------|--------|-------|
| **S**poofing | ✓ con observación #7 | OAuth GitHub vía Better Auth, cookies `httpOnly` + `secure` en prod, sesión validada en cada server action. |
| **T**ampering | ⚠ #6 | Validación zod consistente en todas las actions, regex tight en owner/repo/login. SQL parameterizado vía Drizzle excepto los templates `sql\`\`` con concatenación. CSRF cubierto por mecanismo de server actions de Next 16. |
| **R**epudiation | ✗ #3 | No hay logs de seguridad. |
| **I**nfo Disclosure | ⚠ #2, #8 | Mensajes de error verbosos en `/api/health`. Tokens cifrados at rest ✓. `.env` no en git ✓. |
| **D**oS | ✗ #1, #5, #9 | Sin rate limit. Sin límite de tamaño en cache de contenidos. |
| **E**levation of Privilege | ✓ | Todas las actions resuelven `userId` desde la sesión, nunca aceptan userId del cliente. RBAC server-side. No hay endpoints admin. |

---

## OWASP Top 10 — Mapeo

| Cat | Estado | Hallazgos |
|-----|--------|-----------|
| A01 Broken Access Control | ✓ con #7 | proxy + check en cada action. |
| A02 Crypto Failures | ✓ | AES-256-GCM, scrypt vía Better Auth, TLS asumido en proxy externo (Dokploy/Traefik). |
| A03 Injection | ⚠ #6 | Drizzle parameteriza, regex valida, markdown sanitizado con `rehype-sanitize`. |
| A04 Insecure Design | ⚠ #1 | Falta rate limiting estructural. |
| A05 Security Misconfig | ⚠ #4, #13 | Build placeholder peligroso, sin headers de seguridad. |
| A06 Vulnerable Components | ✓ | 2 moderadas dev-only. |
| A07 Auth Failures | ⚠ #1 | OAuth solo, sin pwd. Falta rate limit en /api/auth. |
| A08 Data Integrity | ✓ | npm pinned vía pnpm-lock, Dockerfile multi-stage con --frozen-lockfile. |
| A09 Logging | ✗ #3 | Sin logs estructurados de seguridad. |
| A10 SSRF | ✓ | Único `fetch` externo es `registry.npmjs.org` con `encodeURIComponent` en el path; no hay URL controlada por usuario. |

---

## Acciones Recomendadas (prioridad)

1. **Bloqueante para release**: ninguno.
2. **Este sprint**: #1 (rate limiting), #2 (sanear /api/health), #4 (endurecer detección de build phase).
3. **Próximo sprint**: #3 (logger), #5 (límite tamaño cache contenidos), #6 (sanear templates SQL).
4. **Backlog**: #7, #8, #9, #10, #13.

---

## Preguntas Abiertas

- ¿Está Dokploy/Traefik delante terminando TLS y forzando HSTS, o se necesita configurarlo en `next.config.ts`?
- ¿Hay algún panel admin / endpoint privilegiado planeado? Si sí, requiere middleware de RBAC adicional.
- ¿La política de retención de logs tiene requisito de compliance (90 días, GDPR, etc.)?
- ¿Quieres aplicar fix automático a #1, #2, #4 ahora con `/ck:security full --fix`?
