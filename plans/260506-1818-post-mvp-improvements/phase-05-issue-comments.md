# Phase 05 — Issue/PR Comments + Create Issue

## Context Links
- [plan.md](plan.md)

## Overview
- **Priority**: P2
- **Status**: pending
- MVP es read-only para issues/PRs. Añadir mutaciones: ver detalle issue/PR, comentar, cerrar/reabrir, crear issue nueva.

## Key Insights
- Octokit endpoints: `issues.get`, `issues.update`, `issues.createComment`, `issues.create`, `pulls.get`, `pulls.createReview`
- Markdown editor server-rendered preview
- Cache invalidation post-mutation crítica

## Requirements
**Funcionales**
- `/repositories/[owner]/[repo]/issues/[number]` — detalle issue con comentarios + form para comentar
- `/repositories/[owner]/[repo]/pulls/[number]` — detalle PR con comentarios + diff stats
- Botón "Close" / "Reopen" en issues y PRs
- "New issue" button en `/issues` → form (title, body, labels)
- Markdown preview en form (react-markdown reuse)

**No funcionales**
- Optimistic UI opcional
- Cache invalida tras comment/close/create

## Architecture
```
src/app/(dashboard)/repositories/[owner]/[repo]/
├── issues/
│   ├── page.tsx (existing)
│   ├── new/page.tsx (form)
│   └── [number]/page.tsx (detail)
└── pulls/
    └── [number]/page.tsx

Service methods:
  getIssue, updateIssue, listIssueComments, createIssueComment,
  createIssue, getPullRequest, listPRComments
```

## Related Code Files
**Crear**
- 4 page files arriba
- `comment-form.tsx` (reusable)
- `issue-detail.tsx`, `pr-detail.tsx`
- Server actions: `commentIssue`, `closeIssue`, `reopenIssue`, `createIssue`

**Modificar**
- `service.ts` — añadir métodos
- `IssueList` — link a detail page

## Implementation Steps
1. Service methods + types
2. Server actions con Zod + cache invalidate
3. Detail pages (RSC fetches)
4. Comment form (client) con preview
5. Action buttons (close/reopen)
6. New issue form
7. PR

## Todo List
- [ ] Service methods
- [ ] Server actions
- [ ] Detail pages
- [ ] Comment form
- [ ] New issue
- [ ] Build + PR

## Success Criteria
- Comentar en issue desde UI funciona
- Close/reopen funciona
- Crear issue redirige al detalle nuevo
- Cache se invalida (no hay datos stale)

## Risk Assessment
- Markdown XSS: rehype-sanitize ya en stack
- Spam: rate limit en server action (futuro)

## Next Steps
→ Phase 06 GH Actions runs
