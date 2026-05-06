# Phase 07 — Settings & Preferencias

## Context Links
- [plan.md](plan.md) · [phase-06-stars-projects-packages.md](phase-06-stars-projects-packages.md)

## Overview
- **Priority**: P2
- **Status**: pending
- Página `/settings` para preferencias del user (theme, default view, pinned repos, default filters), gestión de sesión y revoke access.

## Key Insights
- Preferencias en tabla `user_preferences` (JSONB column flexible)
- Pinned repos: array de `owner/repo` strings, mostrados arriba en lista
- Theme: light/dark/system via `next-themes`
- Revoke: borra account row + invalida cache `gh:{userId}:*`

## Requirements
**Funcionales**
- Settings page con tabs: General, Appearance, Pinned, Account
- Persistir cambios vía server action
- Pin/unpin repo desde lista de repos
- Logout + Revoke GitHub access

**No funcionales**
- Cambios reflejados sin reload (revalidate)

## Architecture
```
src/app/(dashboard)/settings/
├── page.tsx
└── _components/
    ├── general-tab.tsx
    ├── appearance-tab.tsx
    ├── pinned-tab.tsx
    └── account-tab.tsx

src/lib/db/schema.ts        # añadir userPreferences
src/app/actions/settings.ts # server actions
```

## Related Code Files
**Crear**
- `src/app/(dashboard)/settings/page.tsx`
- `src/app/(dashboard)/settings/_components/*.tsx`
- `src/app/actions/settings.ts`
- Migration: `user_preferences` (user_id PK, theme, default_view, pinned_repos jsonb, filters jsonb, updated_at)
- Instalar `next-themes`

## Implementation Steps
1. Migration Drizzle para `user_preferences`
2. `getUserPreferences(userId)` con upsert default si no existe
3. Server actions: `updatePreferences`, `pinRepo`, `unpinRepo`, `revokeAccess`
4. Settings page con shadcn `Tabs`
5. General tab: default_view (dashboard/repositories/stars), default org context
6. Appearance tab: ThemeToggle (light/dark/system)
7. Pinned tab: lista pinned con remove + buscador para añadir
8. Account tab: GitHub login info, "Sign out", "Revoke access" (confirma con dialog)
9. Modificar repo list (phase 5) para mostrar pinned al inicio
10. ThemeProvider en root layout
11. Commit: `feat(settings): user preferences and account management`

## Todo List
- [ ] Migration user_preferences
- [ ] Helper getUserPreferences con upsert
- [ ] Server actions settings
- [ ] Settings page con tabs
- [ ] Theme toggle (next-themes)
- [ ] Pinned management
- [ ] Revoke access flow
- [ ] Pinned mostrados primero en repo list
- [ ] Empty states

## Success Criteria
- Cambiar tema persiste y aplica
- Pin desde repo list aparece en pinned tab
- Revoke borra cuenta y redirige a login
- Default view en login redirige a la vista configurada

## Risk Assessment
- **Revoke incompleto**: tras borrar account, sesión queda inválida; forzar logout
- **Pinned desactualizados**: si user pierde acceso a repo, mostrar disabled

## Security Considerations
- Server actions verifican session.userId == prefs.user_id
- Confirmación explícita en Revoke
- Limpieza de cache Redis al revoke

## Next Steps
- MVP completo. Fase post-MVP: comentar issues/PRs, crear issues, GitHub Actions runs, notifications, GitHub App migration para mejor rate limit.
