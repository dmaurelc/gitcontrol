# Fase 01 — Home: NO excluir pinned + sidebar link a repo personal

## Contexto

1. En fase previa filtré pinned de "Recently updated" en dashboard. Usuario aclaró: SOLO ocultar pinned en `/repositories` listing (visual dedupe), no en home.
2. Sidebar actual no tiene link directo al repo personal del usuario en GitHub.

## Decisiones

- Home "Recently updated": revertir filtro pinned, mantener `sort=pushed`, slice 6.
- Cambiar copy `description` "Last pushed (excluding pinned)" → "Last pushed".
- Sidebar: agregar entry "My GitHub" → external link `https://github.com/{viewerLogin}` (target=_blank). Necesita login del viewer en sidebar — sidebar ya recibe `user` prop en `_components/topbar.tsx` o equivalente. Verificar.

## Archivos

- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/_components/app-sidebar.tsx`
- `src/app/(dashboard)/layout.tsx` (si se necesita pasar login)

## Pasos

1. `dashboard/page.tsx`:
   - Quitar `.filter((r) => !pinnedSet.has(r.full_name))` en `RecentRepos`.
   - `description`: "Last pushed".
2. Sidebar:
   - Verificar prop `user` actual: ya tiene `login` (visto en `AppSidebarUser`).
   - Agregar nuevo entry tipo "external" en sección Workspace o nueva sección "GitHub" antes de Settings: `{ href: \`https://github.com/${login}\`, label: "My GitHub", Icon: Github, external: true }`.
   - Extender `NavItem` type con `external?: boolean`.
   - Render: si `external` → `<a target="_blank" rel="noreferrer">` en vez de `<Link>`.

## Todo

- [ ] Revertir filtro pinned en home
- [ ] Cambiar copy "Last pushed"
- [ ] Sidebar: nav item "My GitHub" con login dinámico
- [ ] Build OK

## Criterio éxito

- Home muestra pinned mezclados con resto en orden por `pushed_at`.
- Sidebar tiene link "My GitHub" que abre `github.com/{user}` en nueva pestaña.

## Riesgos

- Si user no expone `login` al sidebar → `getViewer` desde server component que renderea sidebar. `(dashboard)/layout.tsx` ya carga sesión; podría llamar `getViewer` ahí.
