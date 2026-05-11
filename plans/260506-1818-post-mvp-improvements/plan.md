---
status: completed
created: 2026-05-06
completed: 2026-05-11
project: maureldev-post-mvp
---

# Post-MVP Improvements — Plan

Iteraciones tras shipping MVP a `https://dev.webkode.cl`. Cubre: filtros visibilidad de repos/orgs, UI redesign, mejoras Stars, hardening prod (cleanup debug + monitoring), y features nuevos.

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Visibility filters (orgs + repos) | done | [phase-01-visibility-filters.md](phase-01-visibility-filters.md) |
| 2 | Stars filters & sort | done | [phase-02-stars-filters.md](phase-02-stars-filters.md) |
| 3 | Cleanup prod (remove debug routes) | done | [phase-03-cleanup-prod.md](phase-03-cleanup-prod.md) |
| 4 | UI/UX redesign (sidebar, cards, tipografía) | done | [phase-04-ui-redesign.md](phase-04-ui-redesign.md) |
| 5 | Issue/PR comments + create issue | done | [phase-05-issue-comments.md](phase-05-issue-comments.md) |
| 6 | GitHub Actions runs viewer | done | [phase-06-actions-runs.md](phase-06-actions-runs.md) |
| 7 | Dashboard polish (chart, activity, ⌘K, notifications, header/sidebar) | done | [phase-07-dashboard-polish.md](phase-07-dashboard-polish.md) |

## Out of scope (futuras fases)
- GitHub App migration (rate limit 15k/h + repo selection nativa)

## Build order
Phases 1-3 quick wins. Phase 4 redesign agrupado (más alcance, mejor con `/ui-ux-pro-max` skill). Phases 5-6 features nuevas, paralelizables tras phase 4.
