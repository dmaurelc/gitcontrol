# Phase 07 — Dashboard Polish

## Context Links
- [plan.md](plan.md)

## Overview
- **Priority**: P2
- **Status**: done (2026-05-11)
- Iteración UX dashboard + topbar/sidebar. Hace funcionales placeholders (activity feed, ⌘K, notifications) y agrega chart de contribuciones. Mueve ThemeToggle al topbar y reemplaza footer "v0.1 — self-hosted" del sidebar.

## Sub-phases (commits separados, una rama)

### 7a — Sidebar footer + theme toggle topbar
- Reemplazar línea "v0.1 — self-hosted" en sidebar por mini user-card (avatar + login + email + dropdown con Sign out / Settings).
- Mover `ThemeToggle` (icon-only, cycle light→dark→system) al topbar, izquierda del Avatar.
- **Files**: `_components/topbar.tsx`, `_components/app-sidebar.tsx`, `components/sidebar-user-card.tsx` (nuevo).

### 7b — Activity feed real
- Service: `listViewerEvents(userId, perPage=15)` → `rest.activity.listEventsForAuthenticatedUser`. Cache 60s.
- Component: `activity-feed.tsx` server. Render row por evento con icon (PushEvent/PullRequestEvent/IssuesEvent/WatchEvent/CreateEvent/ForkEvent), actor + repo + verb + relative time.
- Reemplazar placeholder en `dashboard/page.tsx`.

### 7c — Notifications header
- Service: `listNotifications(userId)` → `rest.activity.listNotificationsForAuthenticatedUser`. Cache 30s.
- Server action: `markNotificationReadAction(thread_id)` → `rest.activity.markThreadAsRead`, invalidate `notifications`.
- Component: `notifications-bell.tsx` client. Bell icon en topbar + badge unread count + DropdownMenu con lista (subject.title + repo + reason). Click → link al issue/PR.

### 7d — ⌘K command palette
- Stack: `cmdk` (ya instalado en deps).
- Component: `command-palette.tsx` global client. Mount en topbar. Trigger via input topbar click o keyboard `⌘K` / `Ctrl+K`.
- Sources iniciales:
  - Repos (top 100 cached)
  - Quick links: Dashboard, Repositories, Stars, Settings
  - Recent issues/PRs (last viewed — opcional, puede usar localStorage MRU)
- Esc cierra. Enter navega.

### 7e — Contributions chart
- Stack: shadcn `chart` block (recharts wrapper). Install via `pnpm dlx shadcn@latest add chart`.
- Service: `getContributionsCalendar(userId)` GraphQL `viewer.contributionsCollection.contributionCalendar` (4 weeks o 12 weeks).
- Component: `contributions-chart.tsx` client. Bar/Area chart 7d/30d.
- Bento dashboard: chart toma celda grande (col-span 2 lg).

## Architecture
```
src/
├── lib/github/service.ts (+ 4 methods: listViewerEvents, listNotifications, getContributionsCalendar, markNotificationRead)
├── app/actions/notifications.ts (markRead)
├── components/
│   ├── command-palette.tsx
│   ├── activity-feed.tsx (RSC)
│   ├── contributions-chart.tsx (client)
│   ├── notifications-bell.tsx
│   └── sidebar-user-card.tsx
└── app/(dashboard)/
    ├── _components/
    │   ├── topbar.tsx (ThemeToggle + NotificationsBell + ⌘K trigger)
    │   └── app-sidebar.tsx (footer = sidebar-user-card)
    └── dashboard/page.tsx (replace activity placeholder + agregar chart cell)
```

## Implementation Steps
1. Branch `feat/phase-07-dashboard-polish` desde develop.
2. Sub-phases en commits separados (7a → 7e).
3. Build + lint después de cada sub-phase.
4. PR único `feat/phase-07-dashboard-polish` → develop.

## Todo List
- [ ] 7a Sidebar user-card + ThemeToggle topbar
- [ ] 7b Activity feed real
- [ ] 7c Notifications bell + mark-read
- [ ] 7d ⌘K command palette
- [ ] 7e Contributions chart (recharts via shadcn)
- [ ] Build verde + PR

## Success Criteria
- Dashboard activity card muestra eventos reales del viewer
- Chart visible con contribuciones últimas 4 semanas
- ⌘K abre palette, busca repos + nav rápida
- Notifications bell con badge unread, click thread marca read
- ThemeToggle al lado avatar
- Sidebar footer = mini user-card con sign-out

## Risk Assessment
- recharts +50KB bundle. Mitigación: code-split chart en client component, lazy load.
- GraphQL contributions API rate-limit costoso (1 punto). Cache 5min OK.
- ⌘K global keyboard listener: cleanup en unmount; evitar capturar dentro inputs.
- Notifications API: scope `notifications` puede no estar en OAuth. Verify; si falta, sumar al scope en `lib/auth/auth.ts`.

## Security Considerations
- Notifications mark-as-read: server action verifica session.userId.
- ⌘K queries solo data ya cacheada del usuario (no leak cross-user).

## Next Steps
- Tras 07: dashboard 100% funcional, MVP++ feature-complete.
- Futuro: GitHub App migration (rate limits + repo selection nativa).
