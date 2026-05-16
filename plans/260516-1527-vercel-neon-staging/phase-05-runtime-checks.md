# Phase 05 — Runtime nodejs + sync long-running

**Priority:** P1
**Status:** pending
**Estimated effort:** 30-60min
**Depends on:** phase-02

## Overview

Auditar runtime de route handlers. Vercel Hobby max 10s timeout. Identificar endpoints en riesgo (sync inicial cuenta, listados grandes) y mitigar con `waitUntil` o paginación.

## Context

- Vercel Hobby: 10s timeout serverless function (default).
- Vercel Pro: 60s default, hasta 300s configurable.
- Better Auth + Drizzle + `pg`/`@neondatabase/serverless` requieren `runtime = "nodejs"` (no Edge). Default Next 16 = nodejs → OK, pero verificar que ningún route handler tenga `export const runtime = "edge"`.

## Tasks

### 1. Auditar runtime declarations

```sh
grep -rEn "runtime\s*=\s*['\"]edge" src/
```

Esperado: 0 matches. Si aparece alguno → cambiar a `nodejs` o evaluar viabilidad serverless edge.

### 2. Identificar endpoints potencialmente largos

Candidatos (sync con GitHub multi-page):
- `/api/sync/*` (si existe)
- Server actions que recorren todos los repos del user
- Initial dashboard load tras sign-in

Comando:
```sh
grep -rln "listForAuthenticatedUser\|paginate\|while.*page" src/app src/lib/github
```

### 3. Mitigaciones por endpoint

**Estrategia A — `waitUntil` (Vercel):**
```ts
import { after } from "next/server";
// o: import { waitUntil } from "@vercel/functions";

after(async () => {
  await heavyBackgroundSync();
});
return Response.json({ status: "started" });
```

Response inmediato, sync sigue en background hasta 30s extra Hobby (15min Pro).

**Estrategia B — paginación lazy en UI:**
- Cargar primera página → mostrar. Botón "load more" o infinite scroll.
- Ya implementado en repos/issues/PRs según `src/lib/pagination/`.

**Estrategia C — defer a client:**
- Server component carga skeleton, client component hace fetch incremental.

### 4. Configurar `maxDuration` por route (opcional)

`src/app/api/<endpoint>/route.ts`:
```ts
export const maxDuration = 60; // requiere Pro plan
```

Hobby ignora — queda 10s. Sin error pero truncará. Si tester reporta timeout: upgrade Pro o aplicar Estrategia A.

## Files to audit/modify

- `src/app/api/**/route.ts` — verificar `runtime` y `maxDuration`.
- `src/app/**/page.tsx` — RSC pesados con muchos fetch.
- `src/lib/github/service*.ts` — funciones que paginan completo.

## Acceptance criteria

- [ ] Cero route handlers con `runtime = "edge"`.
- [ ] Endpoints conocidos largos identificados y documentados.
- [ ] Sign-in + dashboard inicial completa en <10s con cuenta tester promedio.
- [ ] Si algún endpoint excede: mitigado con `after()` o paginación.

## Risks

- **Cold start Neon + sync inicial** puede acumular ~3-5s solo de DB → reduce margen para GitHub calls.
- **Testers con cuentas muy grandes** (200+ repos) → primer sync timeout. Solución reactiva: paginar, no proactivamente refactorizar.

## Decisión defaults

- **No agregar `maxDuration` global** todavía. Hobby tier OK para 80% testers.
- Si testers reportan timeout: documentar en issues, decidir Pro tier ($20/mes) vs refactor.

## Testing

Después de deploy phase 06:
1. Sign-in con cuenta personal (baseline).
2. Sign-in con cuenta org grande (test stress).
3. Monitor Vercel logs → buscar `Function execution timed out`.

## Success criteria

- Sign-in + carga dashboard funcionan dentro de 10s para cuentas tester típicas.
- Sin errores `runtime = edge` incompatibles.
- Audit completo documentado en este phase file.
