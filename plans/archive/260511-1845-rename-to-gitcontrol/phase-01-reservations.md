# Phase 01 — Reservas (Manual, fuera de código)

## Priority: HIGH (blocking)
## Status: pending
## Estimated: 30 min

## Overview

Reservar identificadores externos antes de tocar código. Si alguien toma `gitcontrol` en GitHub/npm durante el refactor, plan se rompe.

## Tasks

### Dominios
- [ ] Comprar `gitcontrol.io` (Namecheap/Porkbun/Cloudflare)
- [ ] Pre-order `gitcontrol.dev` (libera julio 2026)

### GitHub
- [ ] Verificar disponibilidad: `gh repo view dmaurelc/gitcontrol` (debe fallar)
- [ ] Decidir: rename existente `dmaurelc/maureldev` → `dmaurelc/gitcontrol` (Phase 04)
- [ ] **Opcional**: reservar org `gitcontrol` GitHub si se quiere futuro

### npm (si aplicará publish)
- [ ] `npm view gitcontrol` — confirmar disponible (verificado ya)
- [ ] **Opcional**: `npm publish --access public` con stub para reservar

### Verificación trademark (opcional)
- [ ] Búsqueda básica USPTO/Google "GitControl trademark"
- [ ] Búsqueda Product Hunt: "GitControl"

## Success Criteria

- Dominios reservados
- Nombre GitHub libre confirmado
- npm name libre confirmado

## Risks

| Risk | Mitigation |
|------|------------|
| `gitcontrol.io` ya tomado | Considerar `gitcontrol.app`, `gitcontrol.tools` |
| `gitcontrol` npm tomado entre research y compra | Reservar inmediato con stub |

## Next Phase

→ Phase 02: Code refactor
