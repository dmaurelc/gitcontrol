# Plan — In-App PR Merge

- **Branch**: `feature/in-app-pr-merge` (desde `develop`)
- **Fecha**: 2026-05-10
- **Objetivo**: Permitir mergear PRs desde la vista `/repositories/[owner]/[repo]/pulls/[number]` sin abandonar maureldev.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 01 | Servicio GitHub: extender `service.ts` con `mergePullRequest`, `getMergeability`, `listChecks`, `listReviews` | Pending |
| 02 | Server action `mergePullRequestAction` con rate-limit + revalidate | Pending |
| 03 | UI cliente: `MergePrButton` con dropdown (merge/squash/rebase), checks panel, mergeable badge | Pending |
| 04 | Integrar en `/pulls/[number]/page.tsx` y testing manual | Pending |

## Key dependencies

- Reutilizar `enforceRateLimit` (`src/lib/rate-limit/check-rate-limit.ts`) con bucket `gh:merge` 5/60s.
- Reutilizar patrón `runAction`/`ActionResult` para errores tipados.
- Octokit endpoints:
  - `pulls.merge` (POST `/repos/{o}/{r}/pulls/{n}/merge`)
  - `repos.getCombinedStatusForRef` o `checks.listForRef` (state CI)
  - `pulls.listReviews`
  - `pulls.get` ya devuelve `mergeable`, `mergeable_state`, `head.sha`.

## Out of scope (this PR)

- Edición de mensaje de squash commit (segunda iteración).
- Auto-delete de branch tras merge (decisión: no, ya confirmada).
- Reviews en el sentido de **crear** review desde maureldev (solo lectura).
- Required reviewers / branch protection rules visualization avanzada.

## Success criteria

- Botón merge bloqueado si `mergeable_state` ∈ {dirty, blocked, behind}.
- Tres opciones reales: merge / squash / rebase.
- Tras merge exitoso, PR muestra badge "Merged" sin reload manual.
- Si checks fallan, panel los muestra en rojo y el merge queda permitido pero con warning (mismo comportamiento que GitHub).
