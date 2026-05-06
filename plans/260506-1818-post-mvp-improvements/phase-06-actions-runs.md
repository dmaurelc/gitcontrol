# Phase 06 — GitHub Actions Runs Viewer

## Context Links
- [plan.md](plan.md)

## Overview
- **Priority**: P3
- **Status**: pending
- Tab "Actions" en repo detalle: lista runs recientes, status, duration, link a logs.

## Key Insights
- Endpoints: `actions.listWorkflowRunsForRepo`, `actions.getWorkflowRun`, `actions.listJobsForWorkflowRun`
- Status: queued/in_progress/completed; conclusion: success/failure/cancelled/skipped
- Logs descargables vía `actions.downloadWorkflowRunLogs` (zip) — opcional, no MVP
- Cache TTL bajo (30s) para runs en progreso

## Requirements
**Funcionales**
- Tab "Actions" en `/repositories/[owner]/[repo]/`
- Lista runs paginada con: workflow name, branch, commit msg, actor, duration, status badge
- Click run → detail con jobs + steps
- Re-run button (call `actions.reRunWorkflow`) — opcional MVP
- Filter por workflow file y status

## Architecture
```
src/app/(dashboard)/repositories/[owner]/[repo]/
├── layout.tsx (add Actions tab to nav)
└── actions/
    ├── page.tsx (list)
    └── [run_id]/page.tsx (detail)

Service: listWorkflowRuns, getWorkflowRun, listJobs
```

## Related Code Files
**Crear**
- 2 page files
- `run-row.tsx`, `job-tree.tsx`

**Modificar**
- `repo-tabs-nav.tsx` — añadir tab
- `service.ts` — métodos actions

## Implementation Steps
1. Service methods (cached por TTL bajo)
2. List page con searchParams (workflow, status, branch)
3. Detail page jobs + steps
4. Re-run action (server action)
5. PR

## Todo List
- [ ] Service methods
- [ ] List + detail pages
- [ ] Tab nav
- [ ] Re-run (opcional)
- [ ] PR

## Success Criteria
- Repos con Actions muestran runs
- Status badges visibles (success green, failure red, in_progress amber)
- Detail muestra jobs + steps colapsables

## Risk Assessment
- Repos sin Actions: empty state amigable
- Permission: scope `repo` ya cubre, no requiere `workflow` salvo trigger nuevos runs (opcional)
- Logs descargables pesados — diferir post-MVP

## Next Steps
- MVP iteration completa. Post: GitHub App migration, notifications, search global
