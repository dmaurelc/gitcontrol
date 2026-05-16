# Phase 03 — Cache toggle (feature flag CACHE_ENABLED)

**Priority:** P0
**Status:** pending
**Estimated effort:** 1h
**Depends on:** phase-01 (env decisions)

## Overview

Hacer Redis opcional vía env var `CACHE_ENABLED`. En Vercel staging: `CACHE_ENABLED=false` → pass-through GitHub API sin cache. En Dokploy: `CACHE_ENABLED=true` (default) → comportamiento actual.

## Context

Redis usado en:
- [src/lib/redis/client.ts](../../src/lib/redis/client.ts) — singleton
- [src/lib/github/cache.ts](../../src/lib/github/cache.ts) — ETag cache GitHub
- [src/lib/rate-limit/check-rate-limit.ts](../../src/lib/rate-limit/check-rate-limit.ts) — rate limit
- [src/app/api/health/route.ts](../../src/app/api/health/route.ts) — health check
- [src/app/api/webhooks/release/route.ts](../../src/app/api/webhooks/release/route.ts) — webhook dedupe

Tráfico testers bajo → 5000 req/h GitHub por user token es suficiente sin cache. Rate-limit interno puede saltarse (asume contador en Redis).

## Approach

1. Env var `CACHE_ENABLED` (boolean default `true`).
2. `REDIS_URL` pasa a opcional (`z.string().url().optional()`).
3. `getRedis()` retorna `null` si `CACHE_ENABLED=false`.
4. Consumidores hacen pass-through cuando `null` (no rompen).

## Files to modify

- `src/lib/env.ts` — `CACHE_ENABLED` flag + `REDIS_URL` opcional.
- `src/lib/redis/client.ts` — retornar `null` si cache deshabilitado.
- `src/lib/github/cache.ts` — bypass si `redis === null`.
- `src/lib/rate-limit/check-rate-limit.ts` — skip rate limit si `redis === null` (o usar contador in-memory por-instance, suficiente serverless).
- `src/app/api/health/route.ts` — reportar `redis: "disabled"` en vez de error.
- `src/app/api/webhooks/release/route.ts` — si webhook depende de dedupe, evaluar (probablemente no crítico staging).

## Implementation

### 1. Env schema

`src/lib/env.ts`:

```ts
const envSchema = z.object({
  // ... existing
  REDIS_URL: z.string().url().optional(),
  CACHE_ENABLED: z
    .union([z.literal("true"), z.literal("false")])
    .default("true")
    .transform((v) => v === "true"),
});
```

Validación cruzada: si `CACHE_ENABLED=true` entonces `REDIS_URL` requerido. Agregar `.refine()`:

```ts
.refine(
  (data) => !data.CACHE_ENABLED || !!data.REDIS_URL,
  { message: "REDIS_URL required when CACHE_ENABLED=true", path: ["REDIS_URL"] }
)
```

### 2. Redis client retorna nullable

`src/lib/redis/client.ts`:

```ts
import "server-only";
import Redis from "ioredis";
import { getEnv } from "@/lib/env";

const globalForRedis = globalThis as unknown as { redis?: Redis | null };

export function getRedis(): Redis | null {
  if (globalForRedis.redis !== undefined) return globalForRedis.redis;
  const env = getEnv();
  if (!env.CACHE_ENABLED || !env.REDIS_URL) {
    globalForRedis.redis = null;
    return null;
  }
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  });
  client.on("error", (err) => {
    console.error("[redis] error", err.message);
  });
  if (env.NODE_ENV !== "production") globalForRedis.redis = client;
  return client;
}
```

### 3. Consumers pass-through

**`src/lib/github/cache.ts`** (patrón):
```ts
const redis = getRedis();
if (!redis) {
  // No cache: hacer fetch directo y retornar.
  return await fetchFn();
}
// ... existing ETag logic
```

**`src/lib/rate-limit/check-rate-limit.ts`**:
```ts
const redis = getRedis();
if (!redis) return { allowed: true, remaining: Infinity }; // skip
```

**`src/app/api/health/route.ts`**:
```ts
const redis = getRedis();
const redisStatus = redis === null ? "disabled" : await pingRedis(redis);
return Response.json({ db: dbStatus, redis: redisStatus });
```

**`src/app/api/webhooks/release/route.ts`**:
- Si dedupe es opcional (webhook idempotente upstream), pass-through OK.
- Si crítico, requerir cache → no usar este endpoint en staging (no se configura webhook GitHub en OAuth App staging).

## Acceptance criteria

- [ ] `CACHE_ENABLED=false` sin `REDIS_URL` → app levanta y queries GitHub funcionan.
- [ ] `CACHE_ENABLED=true REDIS_URL=...` → comportamiento idéntico al actual (Dokploy).
- [ ] `/api/health` retorna `redis: "disabled"` cuando flag off, 200 OK.
- [ ] Sign-in OAuth completa sin Redis.
- [ ] Dashboard carga repos/issues/PRs sin error (más lento = aceptado).
- [ ] No exceptions sobre `redis is null` o `cannot read property of null`.

## Risks

- **Rate limit interno desactivado** → un tester abusivo podría agotar tokens GitHub. Aceptado para staging (5-20 testers conocidos).
- **GitHub API rate limit por token** (5000/h) sin cache ETag puede llegarse antes con navegación intensa. Si pasa: re-enable cache con Upstash (phase futura, no en este plan).
- **Webhook release** queda sin dedupe. Solución: no configurar webhook en staging.

## Testing

```sh
# Modo no-cache
CACHE_ENABLED=false pnpm dev
# Probar dashboard, repos, issues — debería funcionar más lento pero sin errores.

# Modo cache (Dokploy-equiv)
CACHE_ENABLED=true REDIS_URL=redis://... pnpm dev
# Debería ser idéntico al actual.
```

## Success criteria

- App funcional sin Redis.
- Health check pasa.
- No errores runtime relacionados con null redis.
