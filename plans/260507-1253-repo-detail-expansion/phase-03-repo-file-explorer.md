# Fase 03 — Repo file explorer

## Contexto

Pedido: poder navegar archivos del repo dentro del dashboard. GitHub usa `/{owner}/{repo}/tree/{branch}/{path}`.

## Decisión

**Tab dedicada `/repositories/[owner]/[repo]/files`** (no aside compacto). El aside ya tendrá 4 bloques en fase 02; un explorador inline más sería ruidoso. YAGNI: solo tab.

URLs:
- `/repositories/{owner}/{repo}/files` → root del default branch
- `/repositories/{owner}/{repo}/files?path=src/app&ref=develop`

## Insights

- `repos.getContent({ owner, repo, path, ref? })` retorna:
  - Si path es directorio: array `[{ type: "file"|"dir", name, path, sha, size, html_url }, ...]`.
  - Si path es archivo: object con `content` base64 + `encoding`.
- Para listing usamos modo "directory" siempre (en file → mostramos preview).
- Default branch obtenido de `getRepo` (campo `default_branch`).
- File content viewer: usar markdown renderer existente (`react-markdown` ya en deps) para `.md`; sintaxis genérica con `<pre>` + `<code>` para código (sin highlighter por ahora — YAGNI).

## Archivos

### Modificar

- `src/lib/github/service.ts` — `getContent(userId, owner, repo, path, ref?)`.
- `src/app/(dashboard)/repositories/_components/repo-tabs-nav.tsx` — agregar tab "Files".

### Crear

- `src/app/(dashboard)/repositories/[owner]/[repo]/files/page.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/files/_components/file-tree.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/files/_components/file-preview.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/files/_components/breadcrumbs.tsx`

## Pasos

1. Service `getContent`:
   ```ts
   async getContent(userId, owner, repo, path = "", ref?: string) {
     // cachedFetch with resource "contents", params { owner, repo, path, ref }
     // TTL 300s
     // returns the raw API body (array | object)
   }
   ```
2. Page `files/page.tsx`:
   - `searchParams: { path?: string; ref?: string }`.
   - Server: `getRepo` → `default_branch`. Use `ref ?? default_branch`.
   - `getContent(userId, owner, repo, path ?? "", ref)`.
   - Si array → render `FileTree`.
   - Si object con content → render `FilePreview` (decode base64 + render por extensión).
   - `Breadcrumbs` arriba con segmentos de path clickeables.
3. `file-tree.tsx` (server component):
   - Sort: directorios primero, luego archivos, alphabetical.
   - Cada row: icon (Folder/File), nombre, size formateado.
   - Click directorio → `?path={newPath}`.
   - Click archivo → `?path={newPath}` (mismo route, page detecta tipo y renderea preview).
4. `file-preview.tsx`:
   - Decode base64 en server (no envía binarios > 1MB — fallback "open on GitHub").
   - Render por extensión:
     - `.md` → ReactMarkdown.
     - imagenes (`.png/.jpg/.svg/.gif/.webp`) → `<img src={download_url}>`.
     - resto → `<pre><code>{text}</code></pre>` con `whitespace-pre` + scroll.
5. `breadcrumbs.tsx`:
   - Split `path` por `/`, render Link por segmento.
6. Tabs nav: agregar `{ href: \`${base}/files\`, label: "Files" }` después de Overview.

## Todo

- [ ] Service `getContent`
- [ ] Page `/files`
- [ ] FileTree componente
- [ ] FilePreview componente
- [ ] Breadcrumbs componente
- [ ] Tab "Files" en repo nav
- [ ] Build OK

## Criterio éxito

- `/repositories/{owner}/{repo}/files` lista raíz del default branch.
- Click directorio navega; click archivo `.md` muestra render markdown.
- Breadcrumbs permiten subir niveles.
- Repos privados accesibles si token tiene scope.

## Riesgos

- API rate limit: getContent puede ser pesado en repos con miles de archivos. Cache 300s mitiga.
- Archivos binarios grandes → API ya rechaza > 1MB con error específico; manejar y mostrar "Open on GitHub" link.
- Repos vacíos → empty state.
- Rama distinta a default → param `?ref=`. Selector de rama es post-MVP (no incluir aquí — YAGNI).

## Pregunta abierta

- ¿Selector de rama? (No, post-MVP confirmado por simplicidad.)
- Syntax highlighting? (No, post-MVP.)
