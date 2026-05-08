# Phase 06 — Dependency tracker + auto-issue

> Branch: `feature/dependency-tracker` · PR target: `develop` · Esfuerzo: M-L

## Contexto

- Feature **nuevo** (no en scout report) — pedido directo del usuario.
- Por repo: ver dependencias actuales + cuáles tienen versiones nuevas + botón "Crear Issue" que abre issue en GitHub listando outdated.
- Usar GitHub Dependency Graph API (GraphQL) como fuente principal — multi-lenguaje gratis.
- Fallback npm registry para "outdated" en JS/TS (Dep Graph no expone latest version, solo dependencies).

## Insights clave

- GitHub GraphQL: `repository.dependencyGraphManifests` retorna manifests (package.json, requirements.txt, go.mod, pom.xml, Gemfile, etc.) + `dependencies { packageName, requirements, hasDependencies, repository }`. Multi-lenguaje sin parsear.
- Para outdated JS/TS: `https://registry.npmjs.org/<package>/latest` (público, no auth, ~50ms).
- Para outdated Python: `https://pypi.org/pypi/<package>/json` (público).
- Para outdated Go: `https://proxy.golang.org/<module>/@latest`.
- v1: solo npm fallback. Otros ecosistemas en iteración futura (no bloquea).
- Cache fuerte: dep graph TTL 1800s (30min), latest versions TTL 3600s (1h). Bumps frecuentes desperdician cuota.
- Ya existe service action para crear issues: `src/app/(dashboard)/repositories/[owner]/[repo]/issues/new/_components/new-issue-form.tsx` + `createIssueAction` (verificar).

## Requisitos

**Funcionales**
- Nueva tab `/repositories/[owner]/[repo]/dependencies` (al lado de `files`, `insights`, `pulls`, `issues`, `actions`).
- Lista manifests detectados (package.json, requirements.txt, etc.).
- Por dep: nombre, versión actual (rango/exact), versión latest (si JS/TS), badge `outdated` cuando latest > actual.
- Botón "Crear Issue con outdated" → abre dialog → genera body markdown listando outdated → crea issue vía existing action.
- Filtro: only-outdated / all.

**No funcionales**
- 1 GraphQL call para dep graph + N (≤ 100, batched) para latest versions.
- Throttle/queue llamadas a registries externos (concurrency 5).
- Issue body ≤ 65k chars (límite GitHub).

## Arquitectura

```
GET /dependencies page (RSC)
  → getDependencyManifests(userId, owner, repo)   [GraphQL, cached 30min]
       → manifests[] { filename, dependencies[] { name, requirements, ecosystem } }
  → for each JS dep: getNpmLatest(name)            [registry, cached 1h]
  → compute outdated: semver.lt(currentMin, latest)
  → render table

Click "Create Issue":
  → server action openOutdatedIssueAction(owner, repo, manifestSelections)
       → build markdown body
       → createIssue(owner, repo, title, body) via existing service
       → redirect to /repositories/[owner]/[repo]/issues/[number]
```

## Archivos

**Crear**
- `src/lib/github/dependencies.ts` — fetcher GraphQL `getDependencyManifests`.
- `src/lib/registries/npm-registry.ts` — `getNpmLatest(name)` con cachedFetch.
- `src/lib/registries/index.ts` — abstracción `getLatestVersion(ecosystem, name)` (v1 solo npm, otros lanzan `null`).
- `src/lib/dependencies/compute-outdated.ts` — fn pura: input {current, latest} → {isOutdated, severity}. Usa `semver` lib.
- `src/lib/dependencies/build-issue-body.ts` — fn pura: input array outdated → markdown.
- `src/app/(dashboard)/repositories/[owner]/[repo]/dependencies/page.tsx` — RSC tab.
- `src/app/(dashboard)/repositories/[owner]/[repo]/dependencies/_components/manifest-card.tsx` — render por manifest.
- `src/app/(dashboard)/repositories/[owner]/[repo]/dependencies/_components/create-outdated-issue-dialog.tsx` — client dialog.
- `src/app/actions/create-outdated-issue.ts` — server action.

**Modificar**
- `src/lib/github/cache.ts` — agregar `dependencyManifests: 1800`, `npmLatest: 3600`.
- `src/lib/github/service.ts` — exponer `getDependencyManifests` + `createIssue` si no existe ya.
- `src/app/(dashboard)/repositories/[owner]/[repo]/_components/repo-tabs-nav.tsx` (o equivalent) — agregar tab "Dependencies".
- `package.json` — `pnpm add semver` (+ `@types/semver`).

## Pasos

1. Verificar GraphQL `dependencyGraphManifests` está habilitado para account (Dep Graph activo por default en repos públicos, opt-in privados — documentar).
2. Implementar `getDependencyManifests` con paginación cursor (manifests + dependencies). Cache 30min.
3. Implementar `getNpmLatest` con `fetch` + cache 1h + error handling (404 = paquete no existe, network = retry 1x).
4. Implementar `computeOutdated` puro con `semver.coerce` + `semver.lt`.
5. Crear page `/dependencies` RSC: leer manifests → para deps JS llamar `getNpmLatest` (Promise.allSettled, concurrency 5).
6. Render: tabla por manifest, columnas {name, current, latest, status}.
7. Crear dialog "Create Issue": preselecciona outdated, permite editar título, genera body via `buildIssueBody`.
8. Crear `createOutdatedIssueAction` que llama `createIssue` existente y redirect a issue creado.
9. Agregar tab nav.
10. Probar: repo JS con deps desactualizadas → ver outdated → crear issue → verificar issue en GitHub.

## Acceptance

- [ ] Tab "Dependencies" visible en repo detail.
- [ ] Manifests detectados desde GraphQL para JS/TS/Python/Go (read-only — solo JS muestra outdated en v1).
- [ ] Filtro all / only-outdated funciona.
- [ ] Botón "Create Issue" abre dialog → crea issue real en GitHub → redirect.
- [ ] Cache fuerte (no spam a npm registry).
- [ ] Manejo grácil cuando dep graph deshabilitado (mensaje claro al usuario).

## Riesgos

- **Dep Graph requiere habilitación en repos privados** — documentar + mostrar empty state con instrucción.
- **npm registry rate limit**: público ~ ilimitado pero respetuoso. Concurrency 5 + cache 1h es seguro.
- **Body issue > 65KB**: chunk en múltiples issues si supera. **Decisión**: cap a 100 deps en body, mostrar "+ X more" si excede.
- **Versiones pre-release** (alpha, beta): `semver.lt("1.0.0-alpha", "1.0.0")` → true. Decisión UX: marcar pre-release con badge separado, no contar como outdated.
- Llamadas externas desde server (npm registry) no usan token GitHub — sin rate-limit issue, pero sí latencia. Cache 1h crítico.

## Open Questions

- ¿Soporte Python/Go en v1 (sin outdated, solo "current version" desde dep graph)? **Propuesta**: sí, mostrar deps sin badge outdated. Otdated solo JS v1.
- ¿Issue por manifest o issue único con todos? **Propuesta**: 1 issue agrupando outdated, con secciones por manifest.
- ¿Asignar labels al issue creado (`dependencies`, `wave-5`)? Permitir al user editar labels en dialog antes de crear.
- ¿Watch list / alertas cuando aparezca nueva versión? Fuera de scope v1, candidato Wave 6 (junto con email transaccional).
