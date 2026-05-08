# Phase 04 — Repo health score

> Branch: `feature/repo-health-score` · PR target: `develop` · Esfuerzo: M

## Contexto

- Diferenciador vs github.com — pastilla "Health 87/100" + breakdown.
- Datos ya cacheados: commits recientes, open PRs (con `created_at`), open issues (con `updated_at`), Actions runs (status `failure`).
- Sin nueva llamada GitHub por componente — recomputar derivado.

## Insights clave

- Compute puro sobre datos cached → barato + cacheable a su vez (TTL = min de TTLs fuente).
- Score = weighted sum con clamp 0-100. Mostrar como pastilla en `RepoCard` + breakdown en repo detail.
- Componentes propuestos:
  - `commitRecency` (40%): días desde último commit. ≤ 7d = 100, ≤ 30d = 70, ≤ 90d = 40, > 180d = 10.
  - `prAge` (20%): edad mediana PRs abiertos. ≤ 7d = 100, ≤ 30d = 70, > 60d = 30.
  - `issueStaleness` (20%): issues abiertos > 90d sin actividad / total open. < 10% = 100, < 30% = 60, > 50% = 20.
  - `actionsStatus` (20%): última run en default branch. `success` = 100, `failure` = 0, `cancelled/skipped` = 60, sin runs = 70 (neutral).

## Requisitos

**Funcionales**
- Helper puro `computeHealthScore(input) → { total, breakdown }`.
- Server fetcher `getRepoHealth(userId, owner, repo)` orquesta llamadas + cómputo + cache.
- `RepoCard` muestra pastilla compacta (solo total + color: ≥80 verde, ≥60 ámbar, <60 rojo).
- Repo overview muestra breakdown (4 sub-scores con tooltip explicando cada uno).

**No funcionales**
- Cache `repoHealth` con TTL 600s (10min) — invalidate cuando se invalida cualquier source.
- N llamadas paralelas (no secuenciales).

## Arquitectura

```
getRepoHealth(userId, owner, repo)
  ├── parallel:
  │     getRepo / listCommits / listPulls(state=open)
  │     listIssues(state=open) / listWorkflowRuns(branch=default, perPage=1)
  │     ▼
  │  computeHealthScore({ pushedAt, openPrs, openIssues, lastRun })
  │     ▼
  │  cachedFetch(key='repoHealth:{owner}/{repo}', ttl=600)
```

## Archivos

**Crear**
- `src/lib/github/health-score.ts` — fn pura `computeHealthScore` + tipos.
- `src/components/repo-health-badge.tsx` — RSC compacto (solo número + color).
- `src/app/(dashboard)/repositories/[owner]/[repo]/_components/repo-health-breakdown.tsx` — RSC con 4 barras.

**Modificar**
- `src/lib/github/cache.ts` — agregar `repoHealth: 600` a TTL map.
- `src/lib/github/service.ts` — agregar `getRepoHealth(userId, owner, repo)` que orquesta.
- `src/app/(dashboard)/repositories/_components/repo-card.tsx` — render `<RepoHealthBadge total={score} />`.
- `src/app/(dashboard)/repositories/[owner]/[repo]/page.tsx` — render `<RepoHealthBreakdown />` en aside.

## Pasos

1. Diseñar fórmula final (revisar pesos con usuario antes de implementar — ver Open Questions).
2. Implementar `computeHealthScore` con tipo `HealthInput` claro + tests manuales con datos sintéticos.
3. Implementar `getRepoHealth` con `Promise.all` para fuentes y caché final.
4. Crear `<RepoHealthBadge>` (pastilla número + Tooltip con breakdown corto).
5. Crear `<RepoHealthBreakdown>` (4 barras + label + delta vs período anterior — opcional).
6. Wire en `RepoCard` y en `repo overview page`.
7. Probar con 5 repos (uno activo, uno abandonado, uno con CI roto) — validar que score refleja realidad.

## Acceptance

- [ ] Helper puro retorna `{ total: 0-100, breakdown: { commitRecency, prAge, issueStaleness, actionsStatus } }`.
- [ ] Pastilla en `RepoCard` con color por banda.
- [ ] Breakdown en repo overview con 4 sub-scores + tooltip explicando cada uno.
- [ ] Cache 10min, invalidation alineada con sources.
- [ ] Sin nueva llamada GitHub si datos están en cache.

## Riesgos

- Pesos arbitrarios — necesitan iteración. Documentar en código que están sujetos a cambio.
- Repos sin Actions habilitadas: `actionsStatus = 70` neutral (no penalizar).
- Repos archivados / sin actividad por diseño → score bajo da falsa señal. **Decisión**: skip badge si repo es `archived`.

## Open Questions

- ¿Pesos finales? Default propuesto 40/20/20/20. Confirmar antes de mergear.
- ¿Mostrar tendencia (↑↓) comparado a snapshot 7d atrás? Requiere persistir snapshots — propuesto **fase futura**, no en #4.
- ¿Incluir % cobertura tests / dep vulns como factores? Skip por YAGNI; #6 dep-tracker podrá alimentar después.
