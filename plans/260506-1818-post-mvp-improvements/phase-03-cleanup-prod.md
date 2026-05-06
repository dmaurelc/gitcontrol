# Phase 03 — Cleanup Prod

## Context Links
- [plan.md](plan.md)

## Overview
- **Priority**: P1 (security/hygiene)
- **Status**: pending
- Después de verificar prod live, eliminar rutas debug expuestas. Fix Next 16 middleware deprecation warning. Add basic logging.

## Key Insights
- `/api/debug/tables` y `/api/debug/viewer` son útiles solo en dev
- Next 16 deprecó `middleware.ts` — usar `proxy.ts`
- Logs estructurados ayudan debug futuro

## Requirements
**Funcionales**
- Eliminar `/api/debug/tables/route.ts` y `/api/debug/viewer/route.ts`
- Migrar `middleware.ts` → `proxy.ts` (mismo contenido, nuevo nombre)
- Añadir logger simple (`pino` o `console.log` estructurado) para errors

## Related Code Files
**Eliminar**
- `src/app/api/debug/tables/route.ts`
- `src/app/api/debug/viewer/route.ts`

**Renombrar**
- `src/middleware.ts` → `src/proxy.ts` (revisar API si cambió)

**Crear opcional**
- `src/lib/log.ts` — logger wrapper

## Implementation Steps
1. Verify Next 16 docs para `proxy.ts` API (signature puede haber cambiado)
2. Mover middleware logic
3. Rm debug routes
4. Build verify
5. PR feat/phase-03-cleanup-prod

## Todo List
- [ ] Read Next 16 proxy docs (context7)
- [ ] Migrate middleware → proxy
- [ ] Remove debug routes
- [ ] Build OK
- [ ] PR + merge → autodeploy verifica prod

## Success Criteria
- Build sin warnings de middleware deprecation
- `/api/debug/*` retornan 404
- Login + dashboard siguen funcionando

## Risk Assessment
- Next 16 proxy API cambios: chequear docs context7 antes
- Si proxy.ts no funciona idéntico, fallback: dejar middleware.ts (warning aceptable)

## Next Steps
→ Phase 04: UI redesign
