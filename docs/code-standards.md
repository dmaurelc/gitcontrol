# Code Standards

> Conventions enforced (or strongly preferred) across `src/`. New code MUST follow these rules; legacy mismatches are acceptable until the area is touched.

## 1. Project-Wide

- **Next.js 16 is breaking from your training data.** Always read `node_modules/next/dist/docs/` before changing route handlers, server actions, `headers()`/`cookies()` ergonomics, or `searchParams`.
- **`searchParams` is a `Promise`.** Always `await` it inside the page component. See `app/(dashboard)/repositories/page.tsx:23` for the canonical example.
- **`headers()` and `cookies()` are async.** `await headers()` / `await cookies()` everywhere.

## 2. File Naming

| Kind | Convention |
|------|------------|
| TS/TSX modules | kebab-case, descriptive (e.g. `get-github-token.ts`, `active-context.ts`). Long names are fine — better for Grep/Glob. |
| React components | kebab-case file name, PascalCase export (e.g. `org-switcher.tsx` exports `OrgSwitcher`). |
| Route files | Next conventions (`page.tsx`, `layout.tsx`, `route.ts`). |
| Co-located components | `_components/` folder so Next ignores them as routes. |
| Migrations | Drizzle Kit auto-generates (`0000_light_patriot.sql`). Never edit by hand. |

## 3. TypeScript

- Strict mode (set via `tsconfig.json`). No implicit `any`.
- Path alias: `@/*` → `src/*`. Use it instead of relative `../../..`.
- Prefer narrow types over broad ones. Public surfaces (e.g. `Repo`, `Viewer` in `lib/github/service.ts`) intentionally pick only the fields the UI uses.
- Use `as const` for tuple literals like `TYPES = [...] as const` (`packages/page.tsx:10`).
- Errors are domain types (`GithubError`, `UnauthorizedError`, ...) extending `Error`. Map raw upstream errors at the boundary via `mapGithubError`.

## 4. Server / Client Boundary

- **Server-only modules** import `"server-only"` at the top. Applies to anything that touches DB, Redis, env vars, or the GitHub token: `lib/db/*`, `lib/redis/*`, `lib/auth/*` (except `auth-client.ts`), `lib/github/*`, `lib/context/*`, `lib/preferences/*`.
- **Client modules** start with `"use client"` and never import a server-only module directly. They consume server actions via the `actions/` folder or props from RSCs.
- **Server actions** start with `"use server"` and live under `src/app/actions/`. Validate input with Zod when it comes from a form. Always re-throw `NEXT_REDIRECT` errors from `redirect()` (see `actions/create-repo.ts:57-59`).

## 5. Lazy Singletons

DB, Redis, and Auth are wrapped in `Proxy` objects so module-load doesn't trigger env validation. This keeps `next build`'s page-data collection from crashing when `.env` is absent in the build environment. Pattern:

```ts
const globalForX = globalThis as unknown as { x?: T };
function getX(): T { /* construct lazily, cache on globalThis in dev */ }
export const x = new Proxy({} as T, {
  get(_t, prop, recv) {
    const inner = getX() as unknown as Record<PropertyKey, unknown>;
    const v = inner[prop as string];
    return typeof v === "function" ? v.bind(inner) : Reflect.get(inner as object, prop, recv);
  },
}) as T;
```

Used in `lib/db/client.ts`, `lib/auth/auth.ts`. Do not regress to eager singletons.

## 6. GitHub Service Pattern

- Every public method on `githubService` returns `FetchResult<T> = { data, etag?, fromCache }` — never the raw Octokit response.
- Wrap REST calls with `etagFetch` + `cachedFetch`. Wrap GraphQL calls with `cachedFetch` only (GitHub GraphQL ignores `If-None-Match`).
- Catch raw upstream errors at the fetcher level via `mapGithubError`. Never let an Octokit error bubble untyped to a page.
- Cache TTLs live in `lib/github/cache.ts` `TTL` map. Adjust there, not at call sites.
- After mutations (`createRepo`), call `invalidate(userId, resource)` to drop affected cache entries.

## 7. UI / Styling

- Tailwind v4. Do not import `tailwindcss/tailwind.css` — only `app/globals.css`.
- Use `cn()` from `lib/utils.ts` for conditional classes; never string-concatenate class names manually.
- shadcn/ui primitives in `components/ui/` are generated, not hand-written. To update, use `pnpm dlx shadcn@latest add <component>` (style: new-york, baseColor: neutral).
- Icons: `lucide-react` only. Avoid mixing icon libraries.
- Skeleton loaders inside `<Suspense>` for async data sections. See `dashboard/page.tsx:23-28`.

## 8. Authentication & Security

- The OAuth `accessToken` MUST never be returned over the wire. The DB's `account.access_token` column is cleared after Better Auth writes; only `encrypted_access_token` persists.
- `getGithubToken(userId)` is the only sanctioned way to read the token. Do not query `account` directly.
- All protected routes are gated by `middleware.ts`. Adding a new top-level segment? Add its prefix to `PROTECTED_PREFIXES`.
- Server actions MUST re-validate session via `auth.api.getSession({ headers: await headers() })`. Don't trust client-provided userIds.
- `revokeAccessAction` (in `actions/settings.ts`) is the only path that deletes user data. It wipes Redis cache → deletes account row → deletes user → signs out. Order matters.

## 9. Validation

- Use Zod for: env vars (`lib/env.ts`), form input (`actions/create-repo.ts:9-20`).
- Prefer `safeParse` over `parse` when an error needs to be presented to the user.

## 10. Errors & Logging

- `console.error` is fine for unexpected server errors. Don't `console.log` in committed code.
- Octokit's `console.error` for 304 responses is silenced via the custom `noopLog` in `lib/github/client.ts`. Do not remove without reviewing the dev-overlay impact.
- `lib/github/errors.ts` is the only place where status codes map to error classes. Add new status mappings there.

## 11. Database

- All schema changes go through `pnpm db:generate` then a commit of the generated SQL. Never hand-edit `drizzle/*.sql`.
- Use `pnpm db:push` only against a disposable dev DB. Production runs `migrate` via the entrypoint.
- Always use Drizzle query builders, never raw `pg` client calls.
- For complex JSON updates on `userPreferences.pinnedRepos`, use `sql\`...\`` template (see `actions/settings.ts:30-58`).

## 12. Imports & Module Boundaries

- Order: built-in → external → `@/lib/*` → `@/components/*` → relative.
- No circular deps between `lib/auth`, `lib/github`, `lib/context`. The chain is: `lib/auth` → `lib/db` + `lib/redis`; `lib/github` → `lib/auth` + `lib/redis`; `lib/context` → `lib/github`.

## 13. Linting / Formatting

- ESLint via `eslint.config.mjs` (Next 16 + Prettier disable). Run `pnpm lint`.
- Prettier via `pnpm format`.
- Don't commit fix-on-save churn unrelated to the task.

## 14. Commits

- Conventional commits: `feat(scope)`, `fix(scope)`, `refactor(scope)`, `chore(scope)`, etc.
- Recent examples: `feat(repositories): list, filters, detail tabs, issues, PRs, create repo (phase 05)`.
- Never include AI/Claude references in commit messages.
- Never `chore` or `docs` for changes inside `.claude/`.
