# Phase 03 — Devicon tech-stack badges

> Branch: `feature/devicon-badges` · PR target: `develop` · Esfuerzo: S

## Contexto

- `RepoCard` actual muestra lenguaje principal como dot+texto (color GitHub).
- Devicon (https://devicon.dev) ofrece SVG icons para 150+ lenguajes/frameworks.
- Overlay devicon en repo card + repo detail header refuerza posicionamiento "para devs".

## Insights clave

- `githubService.listRepos` ya retorna `language: string | null` (mayor uso del repo según GitHub).
- Mapping `language → devicon-name` requiere lookup table (TypeScript ↔ `typescript`, JavaScript ↔ `javascript`, etc.).
- Devicon CDN: `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/<name>/<name>-original.svg`. Servir local vía `next/image` con `remotePatterns` o auto-host.
- Para multi-lenguaje, GitHub expone `/repos/{owner}/{repo}/languages` (bytes por lenguaje) — ya hay TTL `languages: 3600` en cache pero **no hay fetcher**. Posible subscope: solo top-3 langs.

## Requisitos

**Funcionales**
- `RepoCard` muestra devicon icon (16-20px) junto al lang dot.
- `repo/[owner]/[repo]/overview` (header) muestra top-3 lenguajes con devicon + porcentaje.
- Fallback gracioso: lang sin mapping → fallback a Lucide `Code` icon.

**No funcionales**
- SVG inline o CDN — preferir self-host estático para perf y privacy (sin call jsdelivr en cliente).
- Sin layout shift (reservar height fijo para icon).

## Arquitectura

```
GitHub → listRepos.language ──┐
                              ▼
                  language-to-devicon map (lookup)
                              ▼
              <DeviconBadge name="typescript" /> → public/devicons/typescript.svg
```

Para multi-lang:
```
listLanguages(owner, repo) → { TypeScript: 12345, CSS: 678, ... }
                              ▼
                  top 3 + porcentajes → <DeviconStack langs={...} />
```

## Archivos

**Crear**
- `src/lib/github/language-devicon-map.ts` — map `Record<string, string>` (GitHub lang → devicon name).
- `src/components/devicon-badge.tsx` — RSC component (`<Image src=... />` con fallback).
- `src/components/devicon-stack.tsx` — RSC component para top-N con porcentajes.
- `public/devicons/*.svg` — top 30 lenguajes self-hosted (script para bajarlos, o subset hardcoded).

**Modificar**
- `src/lib/github/service.ts` — agregar `getLanguages(userId, owner, repo)` (ya hay `TTL.languages`).
- `src/app/(dashboard)/repositories/_components/repo-card.tsx` — render `<DeviconBadge name={mapLang(repo.language)} />`.
- `src/app/(dashboard)/repositories/[owner]/[repo]/page.tsx` (overview) — render `<DeviconStack langs={languages} />`.

## Pasos

1. Compilar lista top 30 lenguajes que aparecen en repos del usuario (decidir scope conservador).
2. Crear script `scripts/fetch-devicons.mjs` que descarga SVGs a `public/devicons/`. Ejecutar 1 vez, commitear assets.
3. Crear map `language-devicon-map.ts` (top 30 + alias: "C++" → "cplusplus", "C#" → "csharp", "Go" → "go").
4. Crear `DeviconBadge` con prop `name` + tamaño + fallback Lucide.
5. Crear `getLanguages` fetcher en service (reusa `cachedFetch`).
6. Wire `RepoCard` + `repo overview page`.
7. Probar: repos JS/TS/Python/Go/Rust muestran iconos correctos; repo en lang exótico cae a fallback.

## Acceptance

- [ ] Top 30 SVGs en `public/devicons/`.
- [ ] `RepoCard` muestra icon junto a lang.
- [ ] Repo overview muestra top-3 langs con porcentajes.
- [ ] Fallback Lucide para langs sin mapping.
- [ ] Sin requests externos a jsdelivr en runtime.

## Riesgos

- Bundle/repo size aumenta con SVGs (≈ 30 × 2KB = 60KB). Aceptable.
- Devicon nombres ≠ GitHub language names — el map es la pieza frágil. Test manual con 10 repos diversos.

## Open Questions

- ¿Self-host top-30 o lazy-load CDN con `loading="lazy"`? **Propuesta**: self-host para privacy + perf.
- ¿Mostrar también frameworks (Next.js, React) si están en deps? Sería extender con #6 (dep tracker) — fuera de scope #3.
