---
title: Rename Project — maureldev → GitControl
status: pending
created: 2026-05-11
estimated: 3-4 hours
mode: fast
blockedBy: []
blocks: []
---

# Rename Project: maureldev → GitControl

## Overview

Rename project from personal-branded `maureldev` to product-branded `GitControl`. Producto pasa de portfolio personal a producto público adoptable por cualquier dev.

**Dominio prod actual**: `dev.webkode.cl` (sin cambio en esta fase)
**Dominios reservados**: `gitcontrol.io` (comprar), `gitcontrol.dev` (pre-order julio)
**OAuth callbacks**: URL-based, sin cambio funcional

## Phases

| Phase | Status | Description |
|-------|--------|-------------|
| [01](./phase-01-reservations.md) | pending | Reservar dominios + GitHub + npm |
| [02](./phase-02-code-refactor.md) | pending | Refactor codebase (strings, configs, docker) |
| [03](./phase-03-database-migration.md) | pending | Renombrar Postgres user/db local + prod |
| [04](./phase-04-github-rename.md) | pending | Rename repo en GitHub + update remotes |
| [05](./phase-05-deploy-update.md) | pending | Update Dokploy webhooks + redeploy |
| [06](./phase-06-oauth-rename.md) | pending | Renombrar OAuth apps (cosmético) |
| [07](./phase-07-verification.md) | pending | Verificación end-to-end |

## Key Files Affected

**Config**:
- `package.json` — name field
- `docker-compose.dev.yml` — container names, postgres user/db/password, volumes
- `.env.example` — no cambia (genérico)

**Code (8 files)**:
- `src/app/layout.tsx` — title
- `src/app/login/page.tsx` — heading H1
- `src/app/(dashboard)/_components/app-sidebar.tsx` — sidebar brand
- `src/app/(dashboard)/changelog/page.tsx` — metadata title + heading
- `src/app/(dashboard)/changelog/_components/changelog-empty.tsx` — texto
- `src/app/(dashboard)/report-bug/page.tsx` — metadata title
- `src/app/actions/create-bug-report.ts` — texto issue body
- `src/lib/github/client.ts` — User-Agent header + URL
- `src/lib/github/upstream.ts` — UPSTREAM_REPO constante
- `src/lib/dependencies/build-issue-body.ts` — texto footer

**Docs (5 files)**:
- `README.md`
- `docs/project-overview-pdr.md`
- `docs/system-architecture.md`
- `docs/deployment-guide.md`
- `docs/codebase-summary.md`

**Infra**:
- GitHub repo: `dmaurelc/maureldev` → `dmaurelc/gitcontrol`
- Dokploy app config (URL + nombres)
- Webhooks (release.yml usa RELEASE_WEBHOOK_URL — Dokploy side)

## Out of Scope

- Dominio público nuevo (mantener `dev.webkode.cl` hasta dominio definitivo)
- Logo/branding visual (solo string rename)
- Marketing/launch (post-rename)
- OAuth Client ID/Secret rotation (no necesario)

## Risk Summary

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| DB local rompe | Alta | Backup + recrear con nuevos nombres |
| DB prod rompe | Crítica | Backup + migración cuidadosa o mantener nombres viejos |
| Webhook release roto | Media | Update URL en Dokploy post-rename |
| OAuth login roto | Baja | Callback URLs URL-based, sin cambio |
| Bookmarks externos | Baja | GitHub redirect automático |

## Success Criteria

- ✅ Repo GitHub renombrado, redirect funciona
- ✅ Local dev: `pnpm dev` arranca con nuevos nombres DB
- ✅ Prod deploy: app responde en `dev.webkode.cl`
- ✅ OAuth login funciona (personal + org)
- ✅ Bug report crea issue en repo nuevo
- ✅ Changelog lee releases del repo nuevo
- ✅ Sin strings "maureldev" en código (excepto historia/plans)

## Unresolved Questions

- ¿DB prod actualmente se llama `maureldev`? Si sí, ¿migrar o mantener nombre legacy?
- ¿GitHub username `dmaurelc` permanece o crear org `gitcontrol`?
- ¿Renombrar carpeta local `maureldev` → `gitcontrol` ahora o después?
