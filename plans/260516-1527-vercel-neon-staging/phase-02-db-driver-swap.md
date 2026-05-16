# Phase 02 — Driver DB dual (neon-serverless + selector)

**Priority:** P0
**Status:** pending
**Estimated effort:** 1-2h
**Depends on:** phase-01

## Overview

Agregar driver `@neondatabase/serverless` para Vercel. Mantener `node-postgres` para Dokploy. Selector por env var. Schema Drizzle intacto.

## Context

- Driver actual: `drizzle-orm/node-postgres` + `pg.Pool` en [src/lib/db/client.ts](../../src/lib/db/client.ts).
- Schema: [src/lib/db/schema.ts](../../src/lib/db/schema.ts) (sin cambios).
- Neon serverless soporta dos modos:
  - **`Pool`** (websocket, drop-in con `pg.Pool` API) → `drizzle-orm/neon-serverless`.
  - **`neon()` HTTP** (queries single-shot, no transactions multi-statement) → `drizzle-orm/neon-http`. **NO usar** porque Better Auth puede requerir transactions.

## Approach

Usar `drizzle-orm/neon-serverless` (websocket Pool) → mismo API que `node-postgres`. Selector simple por env var `DB_DRIVER`:

- `DB_DRIVER=neon` (Vercel) → `@neondatabase/serverless` + `drizzle-orm/neon-serverless`
- `DB_DRIVER=node-postgres` o ausente (Dokploy, local) → `pg.Pool` + `drizzle-orm/node-postgres`

## Files to modify

- `package.json` → agregar `@neondatabase/serverless` dependency.
- `src/lib/db/client.ts` → branch por `DB_DRIVER`.
- `src/lib/env.ts` → agregar `DB_DRIVER` opcional al schema zod.
- `drizzle.config.ts` → sin cambios (drizzle-kit usa `DATABASE_URL_UNPOOLED` directo en phase 04).

## Implementation

### 1. Install dependency

```sh
pnpm add @neondatabase/serverless
```

### 2. Update env schema

`src/lib/env.ts`:

```ts
const envSchema = z.object({
  // ... existing fields
  DB_DRIVER: z.enum(["node-postgres", "neon"]).default("node-postgres"),
  // REDIS_URL becomes optional in phase 03; leave required here.
});
```

### 3. Refactor db client

`src/lib/db/client.ts`:

```ts
import "server-only";
import { getEnv } from "@/lib/env";
import * as schema from "./schema";

type Schema = typeof schema;
type DrizzleDb = ReturnType<typeof createDb>;

const globalForDb = globalThis as unknown as {
  drizzleDb?: DrizzleDb;
};

function createDb() {
  const env = getEnv();
  if (env.DB_DRIVER === "neon") {
    // Lazy require to avoid bundling pg in Vercel build
    const { Pool, neonConfig } = require("@neondatabase/serverless") as typeof import("@neondatabase/serverless");
    const { drizzle } = require("drizzle-orm/neon-serverless") as typeof import("drizzle-orm/neon-serverless");
    // Use Node's ws polyfill only outside the edge runtime (we never run edge).
    // In Node 22+ websocket is built-in; neon-serverless picks it up automatically.
    const pool = new Pool({ connectionString: env.DATABASE_URL });
    return drizzle(pool, { schema });
  }
  const { Pool } = require("pg") as typeof import("pg");
  const { drizzle } = require("drizzle-orm/node-postgres") as typeof import("drizzle-orm/node-postgres");
  const pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });
  return drizzle(pool, { schema });
}

function getDb(): DrizzleDb {
  if (globalForDb.drizzleDb) return globalForDb.drizzleDb;
  const instance = createDb();
  if (getEnv().NODE_ENV !== "production") globalForDb.drizzleDb = instance;
  return instance;
}

export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop, receiver) {
    const inner = getDb() as unknown as Record<PropertyKey, unknown>;
    const value = inner[prop as string];
    if (typeof value === "function")
      return (value as (...args: unknown[]) => unknown).bind(inner);
    return Reflect.get(inner as object, prop, receiver);
  },
}) as DrizzleDb;

export type DB = typeof db;
```

**Nota tipos:** `DrizzleDb` colapsa el tipo a la unión runtime. Si causa fricción TypeScript con consumidores, alternativa: tipar explícito a `NodePgDatabase<Schema>` (es estructuralmente compatible con `NeonDatabase<Schema>` porque comparten interfaces base).

### 4. Vercel cache global

En serverless **no se reusa** el pool entre invocations a menos que el container quede caliente. `@neondatabase/serverless` está diseñado para crear conexión por request (websocket rápido). El `globalForDb` solo aplica en dev local — en prod Vercel cada cold start crea nueva instancia. Comportamiento esperado.

## Acceptance criteria

- [ ] `pnpm install` instala `@neondatabase/serverless`.
- [ ] `pnpm dev` con `DB_DRIVER` ausente → corre con `pg` (Dokploy mode).
- [ ] `DB_DRIVER=neon DATABASE_URL=<neon-url> pnpm dev` → corre con neon driver, queries funcionan.
- [ ] `pnpm build` exitoso sin errores TypeScript.
- [ ] Dockerfile build no se rompe (sigue usando `pg` por defecto).

## Risks

- **Bundle size**: `@neondatabase/serverless` agrega ~50KB. Aceptable.
- **Tipos Drizzle divergentes**: `NodePgDatabase` vs `NeonDatabase`. Si rompe, castear a uno común o usar generics.
- **`require()` dinámico en ESM**: Next 16 soporta CommonJS interop pero puede emitir warnings. Alternativa: `import()` dinámico async (requiere refactor `getDb` a async). Probar `require` primero, fallback `await import()` si falla.

## Testing local

```sh
# Modo Dokploy (default)
docker compose -f docker-compose.dev.yml up -d
pnpm dev   # usa pg

# Modo Neon (apuntando a Neon dev branch)
DB_DRIVER=neon DATABASE_URL=<neon-url> pnpm dev
```

## Success criteria

- App levanta en ambos modos sin error.
- Queries Drizzle (`db.select`, `db.insert`) funcionan idénticamente.
- Sign-in OAuth completa exitoso en modo Neon.
