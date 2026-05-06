# Phase 04 — Overview + Org Switcher

## Context Links
- [plan.md](plan.md) · [phase-03-github-service.md](phase-03-github-service.md)

## Overview
- **Priority**: P1
- **Status**: pending
- Layout principal del dashboard: sidebar, topbar con avatar+org switcher, página `/dashboard` con métricas (repos count, stars, PRs abiertos, issues asignados).

## Key Insights
- Org switcher define "contexto activo" persistido en cookie/preferencias (default: user)
- Contexto disponible vía Server Component context o searchParam `?ctx=org-name`
- shadcn/ui: `Sidebar`, `DropdownMenu`, `Avatar`, `Card`

## Requirements
**Funcionales**
- Layout `/dashboard/*` con sidebar persistente
- Topbar con avatar usuario + dropdown logout
- Org switcher (combobox) lista user + orgs disponibles
- Overview muestra: total repos, total stars recibidas, PRs abiertos por mí, issues asignados a mí, últimos repos actualizados

**No funcionales**
- LCP <1.5s en cache hit
- Mobile responsive

## Architecture
```
src/app/(dashboard)/
├── layout.tsx              # sidebar + topbar
├── dashboard/page.tsx      # overview (RSC)
└── _components/
    ├── app-sidebar.tsx
    ├── topbar.tsx
    ├── org-switcher.tsx
    └── overview-cards.tsx

src/lib/context/
└── active-context.ts       # readActiveContext(req) / setActiveContext
```

## Related Code Files
**Crear**
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/_components/app-sidebar.tsx`
- `src/app/(dashboard)/_components/topbar.tsx`
- `src/app/(dashboard)/_components/org-switcher.tsx`
- `src/app/(dashboard)/_components/overview-cards.tsx`
- `src/lib/context/active-context.ts`
- shadcn components: `pnpm dlx shadcn@latest add sidebar avatar dropdown-menu card command popover skeleton`

## Implementation Steps
1. Add shadcn components arriba
2. `active-context.ts`: helper que lee cookie `active_ctx` (default = user login). `setActiveContext` server action que escribe cookie.
3. `layout.tsx`: protegido (verifica session), instancia sidebar + topbar
4. `app-sidebar.tsx`: links a Dashboard, Repositories, Issues, Pull Requests, Stars, Projects, Packages, Settings
5. `org-switcher.tsx`: client component con `Command` + `Popover`, fetch orgs vía server action, on-select dispara `setActiveContext` y `router.refresh()`
6. `topbar.tsx`: muestra contexto activo + avatar + logout
7. `overview-cards.tsx` (server component): llama `service.getViewer`, `service.listRepos({ ctx })`, `service.listMyOpenPRs`, `service.listAssignedIssues` (añadir métodos faltantes en service)
8. Loading states con `Skeleton`
9. Commit: `feat(dashboard): overview page and org switcher`

## Todo List
- [ ] Shadcn components instalados
- [ ] `activeContext` helper + cookie
- [ ] Layout con sidebar+topbar
- [ ] Sidebar con links
- [ ] Org switcher funcional (cambia contexto)
- [ ] Overview cards con datos reales
- [ ] Loading skeletons
- [ ] Mobile sidebar collapsible

## Success Criteria
- Login → llega a `/dashboard` con métricas reales
- Cambiar de user a org actualiza todas las vistas
- Logout funciona desde topbar

## Risk Assessment
- **Métricas costosas**: contar stars implica iterar repos; usar GraphQL `viewer { repositories { totalCount } }` y `repositories(first: 0) { stargazerCount }` agregado
- **Org switcher inconsistencias**: si user pierde acceso a org, validar antes de set

## Security Considerations
- Cookie `active_ctx` validada server-side contra orgs reales del user
- Layout verifica sesión antes de render

## Next Steps
→ Phase 05: Repositories
