# Phase 1 — Bug Report Form → GitHub Issue

## Context

- Pattern reference: [src/app/actions/create-outdated-issue.ts](../../src/app/actions/create-outdated-issue.ts)
- Service method: `githubService.createIssue` en [src/lib/github/service.ts:1223](../../src/lib/github/service.ts)
- Sidebar nav: [src/app/(dashboard)/_components/app-sidebar.tsx](../../src/app/(dashboard)/_components/app-sidebar.tsx)

## Overview

- **Priority**: high (primer feature post-Wave 5)
- **Status**: done
- **Branch**: `feature/bug-report`
- Sección nueva en dashboard `/report-bug` con form que crea un issue en `dmaurelc/maureldev` usando el token OAuth del user logueado.

## Key insights

- `createIssue` ya existe y maneja invalidación de cache + error mapping. **Reutilizar tal cual**.
- Pattern de server action ya validado en `create-outdated-issue.ts` (zod parse + redirect). **Replicar**.
- Privado-first: si el user no es colaborador del repo privado, GitHub responde 404. Mensaje de error debe distinguir 401 (token inválido), 403 (sin scope), 404 (sin acceso/repo no encontrado).
- **No** crear cliente paralelo: usar `githubService` con `userId` de la sesión.

## Requirements

### Funcionales

- Ruta `/report-bug` (server component, dentro de `(dashboard)`).
- Form fields:
  - **Title** (required, 5-256 chars)
  - **Description** (required, 20-65535 chars, markdown soportado)
  - **Type** (select: `bug`, `enhancement`, `question`) → mapea a label
  - **Steps to reproduce** (textarea, opcional, append al body)
  - **Expected vs actual** (textarea, opcional, append al body)
- Body construido en server action: concat secciones con headings markdown.
- Labels auto: `["bug-report", <type>]`.
- Submit success → redirect a `/repositories/dmaurelc/maureldev/issues/<number>` (ruta existente).
- Submit fail → toast error con mensaje legible (sonner ya disponible).
- Link en sidebar dashboard: "Report a bug" con icono `Bug` de lucide.

### No funcionales

- File size <200 LOC por archivo.
- Server component default; client component solo para form (`use client`).
- Validación zod server-side (no confiar client).
- Seguridad: sin XSS (body es markdown, GitHub renderiza). Title plaintext.

## Architecture

```
User → /report-bug (RSC page)
         │
         ↓ <BugReportForm /> (client)
         │  submit FormData
         ↓
       createBugReportAction (server action)
         │  zod parse + build body
         ↓
       githubService.createIssue(userId, OWNER, REPO, {title, body, labels})
         │
         ↓ redirect /repositories/dmaurelc/maureldev/issues/{number}
```

## Related code files

### Crear

- `src/lib/github/upstream.ts` — constantes `UPSTREAM_OWNER`, `UPSTREAM_REPO`.
- `src/app/actions/create-bug-report.ts` — server action.
- `src/app/(dashboard)/report-bug/page.tsx` — RSC page (header, descripción, monta form).
- `src/app/(dashboard)/report-bug/_components/bug-report-form.tsx` — client form (shadcn Form + zod).

### Modificar

- `src/app/(dashboard)/_components/app-sidebar.tsx` — entrada nav "Report a bug" con `Bug` icon.
- `src/app/(dashboard)/_components/mobile-sidebar.tsx` — misma entrada en mobile.

## Implementation steps

1. **Crear `upstream.ts`** con constantes `UPSTREAM_OWNER = "dmaurelc"`, `UPSTREAM_REPO = "maureldev"`.
2. **Server action `create-bug-report.ts`**:
   - Schema zod: `title` (5-256), `description` (20-65535), `type` (enum: bug/enhancement/question), `steps` (opcional, max 10000), `expected` (opcional, max 5000), `actual` (opcional, max 5000).
   - Compone body markdown:
     ```
     ## Description
     {description}

     ## Steps to reproduce
     {steps || "_Not provided_"}

     ## Expected behavior
     {expected || "_Not provided_"}

     ## Actual behavior
     {actual || "_Not provided_"}

     ---
     _Reported via MaurelDev bug report form._
     ```
   - Llama `githubService.createIssue(userId, UPSTREAM_OWNER, UPSTREAM_REPO, { title, body, labels: ["bug-report", type] })`.
   - Catch error → re-throw con mensaje categorizado (401/403/404 vs otro).
   - Success: `redirect(/repositories/{UPSTREAM_OWNER}/{UPSTREAM_REPO}/issues/{number})`.
3. **Page `/report-bug/page.tsx`** (RSC):
   - Verifica sesión con `auth.api.getSession`. Si null → redirect `/login`.
   - Layout: `<Card>` con header "Report a bug" + descripción corta + `<BugReportForm />`.
4. **Client form `bug-report-form.tsx`**:
   - shadcn `Form` (react-hook-form NO está en deps → usar uncontrolled FormData + zod parse client opcional para UX, server hace validación dura).
   - Inputs: `<Input>` title, `<Select>` type, `<Textarea>` description / steps / expected / actual.
   - Submit button con estado loading via `useTransition`.
   - On error: toast con `sonner`.
5. **Verificar OAuth scope `repo`**: revisar `src/lib/auth/auth.ts`. Si scope actual es solo `read:user public_repo` → ampliar a `repo` (necesario para crear issues en repo privado). Documentar en commit.
6. **Sidebar entries** (desktop + mobile): añadir item "Report a bug" con `Bug` icon de `lucide-react`.
7. **Compile check**: `pnpm build` (o `next build` per project script).

## Todo list

- [x] Crear `src/lib/github/upstream.ts`
- [x] Verificar/ampliar OAuth scope a `repo` en `auth.ts`
- [x] Crear server action `create-bug-report.ts` con zod
- [x] Crear página `/report-bug/page.tsx` (auth check + layout)
- [x] Crear client form `bug-report-form.tsx`
- [x] Añadir entry en sidebar desktop
- [x] Añadir entry en sidebar mobile
- [x] Compile + smoke test (login → report-bug → submit → redirect a issue)
- [x] Verificar issue creado en GitHub con labels correctas

## Success criteria

- Form submit con datos válidos → issue aparece en `github.com/dmaurelc/maureldev/issues` con título, body markdown, labels `bug-report` + tipo.
- Sin sesión → redirect a `/login`.
- Sin scope `repo` → error claro (no crash silencioso).
- Body markdown se renderiza correctamente en GitHub (headings, secciones).
- Build pasa sin errors TS/ESLint.

## Risk assessment

| Riesgo | Mitigación |
|--------|------------|
| OAuth actual sin scope `repo` | Verificar `auth.ts`; ampliar si necesario; users existentes deben re-autenticar (un sign-out/sign-in) |
| User sin acceso a repo privado | Error 404 → mensaje "No access to upstream repo. Contact maintainer." |
| Body excede 65535 chars (límite GitHub) | Zod max + suma ≤ 65535 (concat sections) |
| Spam abuse | Repo privado mitiga ahora. TODO future: rate limit per-user vía Redis (out of scope) |

## Security

- Token user nunca expuesto cliente; server action lo lee via `getGithubClients(userId)`.
- Zod max lengths previenen payloads abusivos.
- Markdown body sanitizado por GitHub al renderizar (no es nuestro problema).
- Title plaintext sin escape (GitHub lo escapa).

## Next steps

Tras merge a `develop`: pasar a fase 2 (changelog). Sin dependencia de fase 1.
