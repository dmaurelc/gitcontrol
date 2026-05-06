# Phase 04 — UI/UX Redesign

## Context Links
- [plan.md](plan.md)

## Overview
- **Priority**: P2
- **Status**: pending
- User pidió rediseño completo. MVP UI funcional pero plana. Mejorar jerarquía, spacing, tipografía, motion, dark mode polish.

## Key Insights
- Skill `/ui-ux-pro-max` está disponible: 50+ styles + 161 palettes + 57 font pairings
- shadcn/ui ya integrado; usar variantes y composición
- Dashboard data-heavy → bento grid + cards más informativas
- Mantener Next.js conventions (RSC + client components puntuales)

## Requirements
**Funcionales**
- Sidebar refinado con nesting y separadores visuales
- Topbar con search global (cmd+k) — placeholder, abrir command palette
- Dashboard cards con sparklines / mini charts (chart-1..5 ya en CSS vars)
- Repositories cards con thumbnail (lang color, owner avatar)
- Skeleton loaders consistentes
- Motion: hover states, page transitions sutiles
- Tipografía: heading scale clara, monospace para hashes/codes

**No funcionales**
- Dark mode primario (developers preferirían)
- Mobile responsive limpio
- Sin pesar bundle (no añadir framer-motion si no necesario)

## Architecture
- Diseño system tokens ya en `globals.css` (oklch)
- Crear `components/ui-ext/*` para extensiones (StatCard, Sparkline, EmptyState)
- Tema polish: ajustar radius, shadows, primary/accent

## Related Code Files
**Crear/refactor**
- Topbar: añadir cmd+k trigger
- Sidebar: secciones (Workspace / GitHub / Settings)
- Cards: nuevo `MetricCard` con trend indicator
- `components/empty-state.tsx`
- `components/page-header.tsx` (consistencia)

## Implementation Steps
1. Activar skill `/ui-ux-pro-max` con context current shadcn + Tailwind v4
2. Definir mood board: cuál de los 50 styles aplicar (ej. "minimal-dev", "bento-dashboard")
3. Iterar: dashboard primero, luego repositorios, luego resto
4. Smoke visual via screenshots en cada paso
5. Mobile responsive pass final
6. PR feat/phase-04-ui-redesign

## Todo List
- [ ] Mood board + style decision
- [ ] Tokens polish (radius, shadows)
- [ ] Sidebar v2
- [ ] Topbar + cmd+k stub
- [ ] Dashboard MetricCards rediseñadas
- [ ] Repository cards
- [ ] Skeletons consistentes
- [ ] Empty states
- [ ] Mobile pass
- [ ] PR

## Success Criteria
- Sensación general "premium dev tool" no "scaffold"
- Dark mode pulido
- Mobile usable
- Sin regresiones funcionales

## Risk Assessment
- Scope creep: limitar a phases visibles (Dashboard + Repos), resto en phase futura
- Bundle size: medir después
- Inconsistencias: documentar tokens en `docs/design-tokens.md`

## Next Steps
→ Phase 05 / 06 features nuevos
