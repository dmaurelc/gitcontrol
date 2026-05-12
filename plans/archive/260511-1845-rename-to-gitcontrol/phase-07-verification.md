# Phase 07 — End-to-End Verification

## Priority: HIGH
## Status: pending
## Estimated: 30 min

## Overview

Smoke test completo: local + prod. Confirmar todo funcional post-rename.

## Checklist Local

### Setup
- [ ] `git remote -v` muestra `gitcontrol`
- [ ] `pnpm install` clean
- [ ] `pnpm dev` arranca sin errores
- [ ] Docker containers nuevos arriba: `docker ps | grep gitcontrol`

### UI
- [ ] Browser tab title: "GitControl — GitHub Dashboard"
- [ ] Login page muestra "GitControl"
- [ ] Sidebar muestra "GitControl"
- [ ] Changelog page muestra "GitControl"
- [ ] Report bug page title correcto

### Funcional
- [ ] Login OAuth (local app) completo
- [ ] Dashboard carga repos
- [ ] Switch entre cuenta personal/orgs
- [ ] Crear bug report → issue creado en `dmaurelc/gitcontrol`
- [ ] Changelog lee releases de `dmaurelc/gitcontrol`

## Checklist Producción

### Connectivity
- [ ] `https://dev.webkode.cl` responde 200
- [ ] DNS sin cambio (dominio igual)
- [ ] SSL cert válido

### UI
- [ ] Tab title correcto
- [ ] Branding visible (sidebar, login)
- [ ] Sin texto "MaurelDev" residual

### Funcional
- [ ] Login OAuth (prod app) completo
- [ ] Dashboard carga
- [ ] Bug report crea issue en repo correcto
- [ ] Changelog actualizado
- [ ] Release webhook funcional

### GitHub
- [ ] URL vieja redirige: `https://github.com/dmaurelc/maureldev` → `gitcontrol`
- [ ] Issues + PRs accesibles
- [ ] Releases preservadas
- [ ] Stars/forks preservados

### Dokploy
- [ ] App name actualizado
- [ ] Git provider apunta a repo nuevo
- [ ] Auto-deploy funciona (push a main triggers deploy)

## Search Residual

```bash
# Buscar strings olvidados (excluir plans + .git)
grep -rilE "(maureldev|MaurelDev)" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --include="*.json" --include="*.md" --include="*.yml" \
  | grep -v plans/ | grep -v node_modules
```

Esperado: 0 resultados (o solo en README como "formerly maureldev").

## Sign-off

- [ ] Local funcional
- [ ] Prod funcional
- [ ] Sin regresiones
- [ ] Plan archivable

## Post-Rename Tasks (futuro)

- Update social media (Twitter, LinkedIn) si aplica
- Publicar blog post anunciando rename
- Migrar dominio cuando `gitcontrol.io`/`gitcontrol.dev` listo
- Logo + branding visual update
- Reservar handles redes sociales (@gitcontrol)

## Rollback Total

Si todo rompe sin reparable:

```bash
# GitHub: rename repo back
# Settings → Repository name → "maureldev"

# Local
git remote set-url origin git@github.com:dmaurelc/maureldev.git

# Dokploy
# Revert app config + redeploy previous commit

# Code: revert merge
git revert <merge-commit-sha>
git push
```
