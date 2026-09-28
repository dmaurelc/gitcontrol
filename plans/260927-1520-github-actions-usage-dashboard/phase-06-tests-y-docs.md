---
phase: 6
title: "Tests y docs"
status: completed
priority: P2
effort: "3h"
dependencies: [3, 4, 5]
---

# Phase 6: Tests y docs

## Requirements
- Unit: agregación billing (by OS/repo, filtro product), mapa de cuotas, success rate/duración, mapeo de errores a `status`, parse de `account.scope`.
- Fixtures con respuesta real (anonimizada) capturada en fase 2.
- Verificación manual en preview: user con/sin scope, org admin, org no admin.
- Docs: `docs/system-architecture.md` (§3 scopes, §5b nuevo, failure modes), README (scope `user` + feature). Nota: `project-changelog.md` no existe en el repo; el changelog se genera en la app, así que no se creó.
- Tests con runner nativo de Node (`node --test`), sin nuevas dependencias; 21 tests.

## Success Criteria
- [ ] `lint`, `typecheck`, tests en verde.
- [ ] Docs actualizados.
