# Phase 04 — Migraciones en vercel-build + env schema final

**Priority:** P0
**Status:** pending
**Estimated effort:** 45min
**Depends on:** phase-02, phase-03

## Overview

Mover ejecución de migraciones del entrypoint Docker a build de Vercel. Mantener entrypoint Docker intacto para Dokploy. Finalizar schema env.

## Context

Hoy: `scripts/entrypoint.sh` corre `node migrate.mjs` antes de `node server.js`. Vercel no tiene entrypoint — usa `vercel-build` script o postbuild hook.

Neon recomienda migraciones contra `DATABASE_URL_UNPOOLED` (direct connection) para evitar problemas con pooler en DDL.

## Approach

1. Agregar script `vercel-build` en `package.json` → ejecuta migraciones contra `DATABASE_URL_UNPOOLED` luego `next build`.
2. `scripts/migrate.mjs` ya soporta override via env var → reusar.
3. Vercel detecta `vercel-build` automático y lo usa en vez de `build`.

## Files to modify

- `package.json` → agregar `vercel-build` script.
- `scripts/migrate.mjs` → soportar override `MIGRATION_DATABASE_URL` (opcional, default `DATABASE_URL`).
- `src/lib/env.ts` → schema final consolidado.

## Implementation

### 1. package.json

```json
{
  "scripts": {
    "vercel-build": "node scripts/migrate.mjs && next build"
  }
}
```

**Importante:** El driver de `scripts/migrate.mjs` actual es `node-postgres`. En Vercel build el container es Node 20+ y `pg` está disponible (devDep o dep). Verificar `pg` en `dependencies` de `package.json` (sí, ya está).

Alternativa si `pg` falla en Vercel build (websockets bloqueados, etc): cambiar `migrate.mjs` a usar `@neondatabase/serverless`:

```js
// scripts/migrate.mjs (alt)
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { Pool } from "@neondatabase/serverless";
```

**Decisión:** Probar primero con `pg` (más simple, ya funciona). Si build Vercel falla, swap a neon-serverless.

### 2. scripts/migrate.mjs — soportar override

```js
const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
```

En Vercel env vars setear:
- `DATABASE_URL` = Neon pooled (runtime)
- `MIGRATION_DATABASE_URL` = Neon unpooled (build-time migrations)
- Si no se quiere distinguir → usar mismo URL (Neon pool acepta DDL aunque sub-óptimo).

### 3. Env schema final

`src/lib/env.ts`:

```ts
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().url(),
  DB_DRIVER: z.enum(["node-postgres", "neon"]).default("node-postgres"),
  REDIS_URL: z.string().url().optional(),
  CACHE_ENABLED: z
    .union([z.literal("true"), z.literal("false")])
    .default("true")
    .transform((v) => v === "true"),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  TOKEN_ENCRYPTION_KEY: z
    .string()
    .min(64, "TOKEN_ENCRYPTION_KEY must be 64 hex chars (32 bytes)"),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
}).refine(
  (data) => !data.CACHE_ENABLED || !!data.REDIS_URL,
  { message: "REDIS_URL required when CACHE_ENABLED=true", path: ["REDIS_URL"] }
);
```

Actualizar `BUILD_PLACEHOLDER` con nuevos campos:

```ts
const BUILD_PLACEHOLDER: Env = {
  // ... existing
  DB_DRIVER: "node-postgres",
  REDIS_URL: undefined,
  CACHE_ENABLED: false,
};
```

## Env vars Vercel (staging)

| Var | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon pooled URL |
| `MIGRATION_DATABASE_URL` | Neon unpooled URL |
| `DB_DRIVER` | `neon` |
| `CACHE_ENABLED` | `false` |
| `REDIS_URL` | (vacío) |
| `GITHUB_CLIENT_ID` | staging OAuth App |
| `GITHUB_CLIENT_SECRET` | staging OAuth App |
| `TOKEN_ENCRYPTION_KEY` | nuevo, distinto a prod |
| `BETTER_AUTH_SECRET` | nuevo, distinto a prod |
| `BETTER_AUTH_URL` | `https://gitcontrol-staging.vercel.app` |

## Acceptance criteria

- [ ] `pnpm vercel-build` corre localmente: aplica migraciones y compila.
- [ ] Env schema `lib/env.ts` valida nuevos campos sin romper Dokploy (`DB_DRIVER` default `node-postgres`, `REDIS_URL` opcional pero refine exige si `CACHE_ENABLED=true`).
- [ ] `scripts/migrate.mjs` respeta `MIGRATION_DATABASE_URL` si presente.
- [ ] Dockerfile build sigue funcionando sin cambios (no usa `vercel-build`).

## Risks

- **Migraciones en cada deploy Vercel**: idempotentes (Drizzle skip already-applied) pero suman 5-15s al build. Aceptable.
- **`pg` driver en Vercel build container**: si falla red TCP, swap a `neon-serverless`. Validar primero.
- **Cache miss en serverless function**: cada cold start re-evalúa env. Acceptable.

## Testing

```sh
# Local con Neon (simular Vercel build)
DATABASE_URL=<neon-pooled> MIGRATION_DATABASE_URL=<neon-unpooled> DB_DRIVER=neon CACHE_ENABLED=false pnpm vercel-build
```

Esperado: migraciones corren, build Next exitoso.

## Success criteria

- Build Vercel local exitoso (`pnpm vercel-build`).
- Migrations corren contra Neon sin error.
- Dokploy build sigue funcionando.
