# Fase 05 — Notificaciones: navegación + "Mark all as read" + vista completa

## Contexto

`NotificationsBell` (`src/components/notifications-bell.tsx`):

- `handleMarkRead` en línea 60 marca como read y SOLO redirige si `href` existe via `toInternalRoute`.
- Si `subject.url` es null o no matchea (ej. Discussion, Release), no navega.
- No hay "Mark all as read".
- No hay link "View all notifications".

## Pedido

1. Click en notificación: marcar como read **Y** navegar siempre que sea posible. Si no hay route interna, abrir URL en github.com en nueva pestaña como fallback.
2. Botón "Mark all as read" en header del dropdown.
3. Footer link → `/notifications` (vista nueva con todas).

## Insights

- GitHub `subject.url` es API URL — convertible a `html_url` reemplazando `api.github.com/repos` → `github.com`. Usar como fallback externo.
- Ya hay `markNotificationReadAction` en `src/app/actions/notifications.ts`. Falta `markAllNotificationsReadAction`.
- Octokit: `rest.activity.markNotificationsAsRead({ last_read_at? })` marca todas.

## Archivos

### Modificar

- `src/lib/github/service.ts` — agregar `markAllNotificationsRead(userId)`.
- `src/app/actions/notifications.ts` — agregar `markAllNotificationsReadAction`.
- `src/components/notifications-bell.tsx` — botón "Mark all", footer link, fallback github.com.

### Crear

- `src/app/(dashboard)/notifications/page.tsx` — lista completa con tabs unread/all.

## Pasos

1. `service.ts`:
   ```ts
   async markAllNotificationsRead(userId: string): Promise<void> {
     const { rest } = await getGithubClients(userId);
     await rest.activity.markNotificationsAsRead({});
     await invalidate(userId, "notifications");
   }
   ```
2. `actions/notifications.ts`:
   ```ts
   export async function markAllNotificationsReadAction(): Promise<void> {
     "use server";
     // session check + service.markAllNotificationsRead
   }
   ```
3. `notifications-bell.tsx`:
   - En `DropdownMenuLabel`: agregar `<button>` "Mark all read" cuando `unreadCount > 0`. `onClick` → optimistic update (todos `unread:false`) + call action.
   - En `handleMarkRead`: si `href` null, computar `externalUrl` de `subject.url` y `window.open(externalUrl, "_blank")`.
   - Después del listado, agregar `<DropdownMenuSeparator />` + `<DropdownMenuItem>` con `<Link href="/notifications">View all</Link>`.
4. Crear `/notifications/page.tsx`:
   - `PageHeader` "Notifications" con action `<MarkAllReadButton />`.
   - Filter chip simple: toggle "Show read" (default off → solo unread). Query `?showRead=1`.
   - SSR fetch `githubService.listNotifications(userId, { all: showRead })`.
   - Render lista con mismas reglas (link interno o externo).
   - Empty state.

## Todo

- [ ] Service `markAllNotificationsRead`
- [ ] Action `markAllNotificationsReadAction`
- [ ] Botón "Mark all read" en bell
- [ ] Fallback `window.open` para subject sin route interna
- [ ] Footer link a `/notifications`
- [ ] `/notifications/page.tsx` con filter chip "Show read"
- [ ] Build OK

## Criterio éxito

- Click en notificación: SIEMPRE navega (interno o nueva pestaña externa).
- Botón "Mark all read" deja contador en 0 sin recargar.
- `/notifications` muestra todas con toggle unread/all.

## Riesgos

- `markNotificationsAsRead` sin args marca todo desde el inicio del tiempo. Puede pasar `last_read_at: new Date().toISOString()` para marcar hasta ahora — comportamiento idéntico para usuario.
- Notificaciones cache TTL 30s — invalidate después de mark all.

## Seguridad

- Action requiere session. Validar `userId` desde `auth.api.getSession`.

## Notas

- Filter chip simple confirmado por usuario (no tabs).
