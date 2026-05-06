# Phase 01 — Setup Base

## Context Links
- [plan.md](plan.md)
- [brainstorm](../reports/brainstorm-260506-1300-github-dashboard.md)

## Overview
- **Priority**: P0 (blocker para todo)
- **Status**: pending
- Inicializa proyecto Next.js 16 con TS, Tailwind v4, shadcn/ui, Drizzle ORM, conexiones a Postgres/Redis (Dokploy), estructura de carpetas, ESLint/Prettier, Docker para deploy.

## Key Insights
- Next.js 16 usa App Router por defecto y RSC; aprovechar Server Actions para mutaciones
- Tailwind v4 usa `@import "tailwindcss"` y config en CSS
- Drizzle preferido sobre Prisma por type-safety y bundle size
- Dokploy gestiona Docker; entregar `Dockerfile` + `docker-compose.yml` opcional

## Requirements
**Funcionales**
- Proyecto compilable con `pnpm build`
- Conexión funcional a Postgres y Redis
- Migración inicial Drizzle ejecutable

**No funcionales**
- TypeScript strict
- Bundle inicial sano (no libs pesadas en cliente)
- Imágenes Docker reproducibles

## Architecture
```
github-dashboard/
├── src/
│   ├── app/                    # Next.js App Router
│   ├── components/ui/          # shadcn/ui
│   ├── lib/
│   │   ├── db/                 # Drizzle client + schema
│   │   ├── redis/              # Redis client
│   │   └── env.ts              # Env validation (Zod)
│   └── styles/globals.css
├── drizzle/                    # Migrations
├── Dockerfile
├── drizzle.config.ts
├── next.config.ts
└── package.json
```

## Related Code Files
**Crear**
- `package.json`, `tsconfig.json`, `next.config.ts`
- `src/lib/env.ts` (Zod env validation)
- `src/lib/db/client.ts`, `src/lib/db/schema.ts`
- `src/lib/redis/client.ts`
- `drizzle.config.ts`
- `Dockerfile`, `.dockerignore`
- `.env.example`

## Implementation Steps
1. `pnpm create next-app@latest` con TS, Tailwind, App Router, src/, ESLint
2. Verificar versión Next.js 16.x; ajustar si la CLI bajó otra
3. Instalar deps: `drizzle-orm pg @types/pg`, `ioredis`, `zod`, `@octokit/rest @octokit/graphql`
4. Dev deps: `drizzle-kit`, `@types/node`, `prettier`, `eslint-config-prettier`
5. Init shadcn/ui: `pnpm dlx shadcn@latest init` (theme: neutral, dark mode)
6. Crear `src/lib/env.ts` validando: `DATABASE_URL`, `REDIS_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `TOKEN_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
7. `src/lib/db/client.ts`: `drizzle(new Pool({ connectionString }))`
8. `src/lib/db/schema.ts`: tablas placeholder (se llenan en phase 2)
9. `drizzle.config.ts`: schema path, dialect postgresql
10. `src/lib/redis/client.ts`: ioredis singleton lazy
11. Dockerfile multi-stage (deps → build → runner) con `output: 'standalone'` en `next.config.ts`
12. `.env.example` documentando todas las vars
13. README mínimo con setup local
14. Commit: `feat: initial Next.js 16 setup with Drizzle and Redis`

## Todo List
- [ ] Scaffold Next.js 16 con flags correctos
- [ ] Instalar deps runtime + dev
- [ ] Init shadcn/ui
- [ ] Env validation Zod
- [ ] Drizzle client + config
- [ ] Redis client
- [ ] Dockerfile standalone
- [ ] `.env.example`
- [ ] Smoke test: `pnpm dev` → home renderiza
- [ ] Smoke test: conexión DB + Redis desde un route handler `/api/health`

## Success Criteria
- `pnpm build` sin errores
- `pnpm dev` sirve home
- `/api/health` responde `{ db: 'ok', redis: 'ok' }`
- Docker image build OK

## Risk Assessment
- **Next.js 16 muy reciente**: posibles incompatibilidades con shadcn/ui o ioredis. Mitigación: pinear versión y testear early.
- **Tailwind v4 breaking changes**: revisar docs si shadcn aún usa v3. Fallback: Tailwind v3.
- **Drizzle PG SSL**: Neon/Dokploy pueden requerir `?sslmode=require`.

## Security Considerations
- `.env` jamás commiteado (verificar `.gitignore`)
- Env validado en boot (fail-fast si falta var)
- `TOKEN_ENCRYPTION_KEY` mínimo 32 bytes random

## Next Steps
→ Phase 02: Auth con Better Auth + GitHub OAuth
