---
phase: 3
title: "Widget minutos en home"
status: completed
priority: P1
effort: "3h"
dependencies: [2]
---

# Phase 3: Widget de minutos en `/dashboard`

## Overview
Tarjeta en home: "X / Y min usados este mes", barra de progreso, desglose por OS, link a `/actions`.

## Requirements
- Estados: ok, sin scope (CTA botón de fase 1), org sin permisos (mensaje), sin cuota conocida (solo minutos usados), 0 uso.
- Colores barra: normal <70%, warning 70–90%, danger >90% (tokens de tema existentes).
- Suspense propio con skeleton (no bloquear resto del home).

## Related Code Files
- Create: `src/components/actions-usage-card.tsx` (server)
- Modify: `src/app/(dashboard)/dashboard/page.tsx` (insertar en Suspense; archivo 389 líneas — solo añadir import + bloque)
- Reuse: `StatCard`, `Skeleton`

## Implementation Steps
1. Componente server que llama `getActionsUsage` con contexto activo.
2. Render de estados.
3. Insertar en grid del home.
4. Verificar en preview (light/dark, móvil).

## Success Criteria
- [ ] Widget visible en home con dato real.
- [ ] Error de billing no rompe el home.
