# Phase 04 — GitHub Repo Rename

## Priority: HIGH
## Status: pending
## Estimated: 15 min

## Overview

Renombrar repo GitHub. Historial 100% preserve. Redirects automáticos.

## Pre-conditions

- ✅ Phase 02 (code refactor) commited en branch
- ✅ PR opcional creado y merge to main (o push direct si solo dev)
- ✅ Phase 01 reservations OK

## Steps

### 1. Merge code refactor a main

```bash
git checkout main
git merge feat/rename-to-gitcontrol
git push origin main
```

### 2. Rename repo en GitHub UI

```
Settings → General → Repository name
"maureldev" → "gitcontrol"
Save
```

GitHub:
- Crea redirect `dmaurelc/maureldev` → `dmaurelc/gitcontrol`
- Preserva: commits, branches, tags, releases, issues, PRs, stars, forks, wiki, discussions
- URLs viejas redirigen
- `git clone <url-vieja>` sigue funcionando

### 3. Update remote local

```bash
git remote set-url origin git@github.com:dmaurelc/gitcontrol.git
# Verificar
git remote -v
# Test
git fetch
git pull
```

### 4. Update repo metadata

GitHub repo settings:
- Description: "GitControl — Self-hosted GitHub dashboard (formerly maureldev)"
- Topics: `dashboard`, `github`, `self-hosted`, `nextjs`, `dev-tools`
- Website: `https://dev.webkode.cl` (sin cambio temporal)

### 5. Renombrar carpeta local (opcional)

```bash
cd ~/Desktop/ProyectosDev
mv maureldev gitcontrol
cd gitcontrol
# Update IDE workspace si aplica
```

**Caveat**: Romperá paths absolutos en plans/ y configs locales. Decidir si vale o esperar.

## Validation

- [ ] `gh repo view dmaurelc/gitcontrol` funciona
- [ ] `git fetch` desde local funciona
- [ ] URL vieja redirige: `curl -I https://github.com/dmaurelc/maureldev`
- [ ] Issues + PRs intactos
- [ ] Releases intactas

## Risks

| Risk | Mitigation |
|------|------------|
| Webhooks rompen | Phase 05 update Dokploy |
| CI/CD broken | Verificar `.github/workflows/` no tiene URL hardcoded |
| Carpeta local rename rompe IDE | Hacer rename al final, no aquí |

## Next Phase

→ Phase 05: Deploy update
