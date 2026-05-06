# Phase 03 — GitHubService (Octokit + Cache)

## Context Links
- [plan.md](plan.md) · [phase-02-auth.md](phase-02-auth.md)

## Overview
- **Priority**: P0
- **Status**: pending
- Wrapper server-only sobre Octokit con cache Redis por usuario+endpoint, ETag revalidation, y manejo centralizado de rate limits.

## Key Insights
- 5000 req/h por user token; cache es crítico
- ETags permiten revalidación 304 (no consume rate limit) — usar siempre que GitHub los devuelva
- Una instancia de Octokit por request (no singleton, porque el token cambia por user)
- GraphQL para Projects v2 (REST no expone v2)

## Requirements
**Funcionales**
- `getOctokit(userId)` retorna cliente con token descifrado
- `cachedFetch(userId, key, fetcher, ttl)` envuelve cualquier llamada
- ETag revalidation transparente
- Métodos tipados: `getViewer`, `listRepos`, `getRepo`, `listIssues`, `listPRs`, `listStars`, `listOrgs`, `listPackages`, `createRepo`, `getProjects`

**No funcionales**
- Solo `import 'server-only'`
- Errores tipados (RateLimit, NotFound, Unauthorized)

## Architecture
```
src/lib/github/
├── client.ts              # getOctokit(userId)
├── cache.ts               # cachedFetch + key builder
├── service.ts             # high-level methods
├── errors.ts              # custom errors
└── types.ts               # response types

Redis key pattern:
  gh:{userId}:{resource}:{paramsHash}
  gh:etag:{userId}:{resource}:{paramsHash}  → stored ETag
```

## Related Code Files
**Crear**
- `src/lib/github/client.ts`
- `src/lib/github/cache.ts`
- `src/lib/github/service.ts`
- `src/lib/github/errors.ts`
- `src/lib/github/types.ts`

## Implementation Steps
1. `client.ts`: `async function getOctokit(userId)` → token via `getGithubToken` → `new Octokit({ auth: token, request: { hook } })`. Hook captura headers de rate limit y los expone.
2. `cache.ts`:
   - `buildKey(userId, resource, params)` → hash params con `crypto.subtle` o simple JSON+sha
   - `cachedFetch<T>(opts)`:
     - Lee `gh:...` → si hit y no expirado → return
     - Lee ETag almacenado, si existe pasar header `If-None-Match`
     - Si 304 → renueva TTL, retorna valor cached
     - Si 200 → guarda body + nuevo ETag
3. `service.ts` métodos: `getViewer(userId)`, `listRepos(userId, {affiliation, sort, lang, page})`, `getRepo(userId, owner, name)`, `listIssues(userId, owner, repo, state)`, `listPRs(userId, owner, repo, state)`, `listStars(userId, page)`, `listOrgs(userId)`, `listPackages(userId, owner)`, `createRepo(userId, input)`, `listProjectsV2(userId, owner)` (GraphQL)
4. TTLs en const: `TTL = { viewer: 3600, repos: 300, repo: 300, issues: 120, prs: 120, stars: 600, orgs: 1800, packages: 600, projects: 300 }`
5. `errors.ts`: `class RateLimitError`, `NotFoundError`, `UnauthorizedError` — mapear códigos 401/403/404/429
6. Smoke test route `/api/_debug/viewer` (solo dev) que llama `service.getViewer(session.userId)`
7. Commit: `feat(github): Octokit service with Redis cache and ETag revalidation`

## Todo List
- [ ] `client.ts` con Octokit per-user
- [ ] `cache.ts` con ETag + TTL
- [ ] `service.ts` con métodos MVP
- [ ] Errores tipados
- [ ] Test cache hit/miss/304
- [ ] Test rate limit warning (mock)

## Success Criteria
- Llamada repetida en <TTL devuelve desde Redis (verificable con logs)
- ETag genera 304 al revalidar
- Token nunca expuesto fuera del módulo
- Errores 401 invalidan sesión y redirigen a login

## Risk Assessment
- **ETag mismatch**: algunos endpoints no envían ETag estable; aceptar y solo TTL
- **Cache stale**: invalidación post-mutación (e.g. crear repo → invalida `gh:{userId}:repos:*`)
- **Concurrencia**: dos requests simultáneos pueden ambos missear cache; aceptable, no usar lock por simplicidad

## Security Considerations
- Módulo marcado `import 'server-only'`
- Token nunca loggeado
- Cache aislado por `userId` (jamás compartir entre users)
- En logout: opcional limpiar `gh:{userId}:*`

## Next Steps
→ Phase 04: Overview UI consumiendo GitHubService
