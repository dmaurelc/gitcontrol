# Fase 02 — Repo aside: Tags + Releases + Contributors

## Contexto

`/(dashboard)/repositories/[owner]/[repo]/page.tsx` (Overview) hoy: README + aside con Languages.
Pedido: agregar bloques Tags, Releases, Contributors al aside.

## Insights

- Aside ya es columna fija 280px. Si crece mucho → scroll natural con flex-col.
- Mostrar top N (5-6) en aside; "View all" al portal externo de github.com (no creamos vistas dedicadas — YAGNI).
- Endpoints REST:
  - `repos.listTags({ owner, repo, per_page: 6 })`
  - `repos.listReleases({ owner, repo, per_page: 6 })` — ordena por `created_at` desc por default
  - `repos.listContributors({ owner, repo, per_page: 8 })` — ordena por contributions desc

## Tipos

```ts
export type RepoTag = { name: string; commit: { sha: string }; zipball_url: string };
export type RepoRelease = {
  id: number;
  name: string | null;
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  published_at: string | null;
  html_url: string;
};
export type RepoContributor = {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
};
```

## Archivos

### Modificar

- `src/lib/github/service.ts` — `listTags`, `listReleases`, `listContributors` con cache TTL 600s, resource keys `tags`, `releases`, `contributors`.
- `src/app/(dashboard)/repositories/[owner]/[repo]/page.tsx` — render aside con secciones nuevas.

### Crear

- `src/app/(dashboard)/repositories/[owner]/[repo]/_components/repo-aside-tags.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/_components/repo-aside-releases.tsx`
- `src/app/(dashboard)/repositories/[owner]/[repo]/_components/repo-aside-contributors.tsx`

## Pasos

1. Service: agregar 3 métodos con `cachedFetch`. Patrón existente (`listLanguages`).
2. Componentes server async. Cada uno fetcha lo suyo en paralelo (no bloquearse mutuamente — usar `Suspense` por bloque o `Promise.allSettled` en page).
3. Aside layout en `page.tsx`:
   ```
   <Card> Languages </Card>
   <Card> Releases (top 6) </Card>
   <Card> Tags (top 6) </Card>
   <Card> Contributors (top 8) avatares </Card>
   ```
4. Cada bloque con header, lista compacta, footer "View all on GitHub" → `https://github.com/{owner}/{repo}/{tags|releases|graphs/contributors}`.

### Detalles UI

- Releases: badge "draft"/"prerelease", fecha relativa, link a `release.html_url` external.
- Tags: monospace `name`, sha corto.
- Contributors: grid de 4 columnas de avatares con tooltip (login + count).

## Todo

- [ ] Tipos en service
- [ ] `listTags` + `listReleases` + `listContributors`
- [ ] Componente aside-tags
- [ ] Componente aside-releases
- [ ] Componente aside-contributors
- [ ] Integrar en page.tsx
- [ ] Build OK

## Criterio éxito

- Aside del repo muestra 4 bloques: Languages, Releases, Tags, Contributors.
- Click en "View all" abre github.com correspondiente en nueva pestaña.

## Riesgos

- Repos sin tags/releases → empty state per bloque (no romper layout).
- Contributors API puede paginar y requerir fetch repetido en repos enormes; perfil de aside mantiene `per_page=8` un solo request.

## Seguridad

- `html_url` viene de API confiable; `target=_blank rel=noreferrer`.
