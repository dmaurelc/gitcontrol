# Phase 03 — Database Migration

## Priority: HIGH (delicado)
## Status: pending
## Estimated: 30 min

## Overview

Postgres local actual: user/db/password = `maureldev`. Update docker-compose + recrear DB local. Prod requiere decisión separada.

## Current State (`docker-compose.dev.yml`)

```yaml
postgres:
  container_name: maureldev-postgres-dev
  environment:
    POSTGRES_USER: maureldev
    POSTGRES_PASSWORD: maureldev_dev
    POSTGRES_DB: maureldev
  volumes:
    - maureldev_pg_data:/var/lib/postgresql/data

redis:
  container_name: maureldev-redis-dev
  command: redis-server --requirepass maureldev_dev
  volumes:
    - maureldev_redis_data:/data

volumes:
  maureldev_pg_data:
  maureldev_redis_data:
```

## Target State

```yaml
postgres:
  container_name: gitcontrol-postgres-dev
  environment:
    POSTGRES_USER: gitcontrol
    POSTGRES_PASSWORD: gitcontrol_dev
    POSTGRES_DB: gitcontrol
  volumes:
    - gitcontrol_pg_data:/var/lib/postgresql/data

redis:
  container_name: gitcontrol-redis-dev
  command: redis-server --requirepass gitcontrol_dev
  volumes:
    - gitcontrol_redis_data:/data

volumes:
  gitcontrol_pg_data:
  gitcontrol_redis_data:
```

## Local Migration Steps

### Opción A: Recrear DB (pierde data local)

```bash
# Backup primero (si tienes data importante)
docker exec maureldev-postgres-dev pg_dump -U maureldev maureldev > backup-pre-rename.sql

# Detener + eliminar containers + volumes
docker compose -f docker-compose.dev.yml down -v

# Update docker-compose.dev.yml con nuevos nombres
# Update .env local DATABASE_URL=postgres://gitcontrol:gitcontrol_dev@localhost:5433/gitcontrol
# Update .env local REDIS_URL=redis://default:gitcontrol_dev@localhost:6379

# Arrancar
docker compose -f docker-compose.dev.yml up -d

# Restaurar data (si backup)
docker exec -i gitcontrol-postgres-dev psql -U gitcontrol gitcontrol < backup-pre-rename.sql

# Run migrations
pnpm db:migrate  # o comando equivalente del proyecto
```

### Opción B: Mantener DB local con nombres viejos (más simple)

- NO tocar `docker-compose.dev.yml`
- NO tocar `.env` local
- Solo cambiar referencias en docs marcando como "legacy local naming"
- Decisión documental: containers/db locales mantienen `maureldev_*` por simplicidad

**Recomendado**: Opción A — limpio, evita confusion futura. Backup antes.

## Production Decision (Dokploy)

**Crítico**: ¿DB prod actualmente usa nombres `maureldev`?

- Si SÍ: NO renombrar DB prod en este sprint. DB rename = downtime + riesgo. Solo update código que conecta.
- Si NO: ya está separado, sin acción.

**Action**: Verificar en Dokploy → Postgres service → environment vars.

## .env Updates (local)

```bash
# .env.local (NO commit)
DATABASE_URL=postgres://gitcontrol:gitcontrol_dev@localhost:5433/gitcontrol
REDIS_URL=redis://default:gitcontrol_dev@localhost:6379
```

## .env.example Update

Update comment en `.env.example` si tiene ejemplo con nombres viejos. Verificar:

```bash
grep -i "maureldev" .env.example
```

## Validation

- [ ] `docker compose ps` muestra containers nuevos
- [ ] `pnpm dev` conecta DB correctamente
- [ ] Login funciona (sesión persiste)
- [ ] Migrations corren clean

## Risks

| Risk | Mitigation |
|------|------------|
| Pérdida data local | Backup pg_dump antes |
| Migrations fallan | Revisar drizzle/prisma config — usa env var, no hardcoded |
| Redis cache invalidación | Esperado, no issue |

## Next Phase

→ Phase 04: GitHub repo rename
