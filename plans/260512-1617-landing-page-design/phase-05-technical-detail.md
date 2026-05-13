# Phase 5 — Technical Detail (Architecture · Cache TTL · Security)

## Context Links

- [docs/system-architecture.md](../../docs/system-architecture.md) §1 Topology, §5 GitHub API Layer, §4 Token Storage, §6 Multi-User Isolation
- [docs/landing-DESIGN.md](../../docs/landing-DESIGN.md) — Code Block, Comparison Row Table specs
- [src/lib/github/cache.ts](../../src/lib/github/cache.ts) — real TTL values

## Overview

- **Priority:** P1 (credibility — developers vet self-hostable tools by digging into the architecture)
- **Status:** Pending
- **Brief:** Three stacked sections that prove the project is technically sound: architecture diagram + cache philosophy, the real cache TTL table, and the security/privacy story.

## Key Insights

- The audience for this section is developers evaluating whether to deploy. They want concrete numbers and named files, not "enterprise-grade security."
- Render the architecture diagram inline as styled `<pre>` mono text on `bg-muted`. No image asset, no diagramming dep.
- The TTL table is real data. Mistyping a value undermines credibility — copy verbatim from `lib/github/cache.ts`.

## Requirements

### Functional

- `<ArchitectureSection>` anchored at `#architecture` — heading + 3 feature cards summarizing perf decisions + ASCII topology diagram + cache invalidation explanation.
- `<CacheTtlTable>` — compact mono table of resource → TTL.
- `<SecurityPrivacySection>` — 3-column grid with lock/shield icons explaining encryption, isolation, ownership.

### Non-functional

- RSC only.
- Diagram readable on mobile (horizontal scroll inside the `<pre>` block).
- All numbers traceable to source files.

## Architecture

```
src/components/marketing/
  architecture-section.tsx
  architecture-diagram.tsx         (the <pre> ASCII block, isolated for readability)
  cache-ttl-table.tsx
  security-privacy-section.tsx
```

## Related Code Files

### To create

- `src/components/marketing/architecture-section.tsx`
- `src/components/marketing/architecture-diagram.tsx`
- `src/components/marketing/cache-ttl-table.tsx`
- `src/components/marketing/security-privacy-section.tsx`

### To modify

- `src/components/marketing/landing-page.tsx` — append the three new sections after `<DashboardTourSection />`.

## Implementation Steps

### 5.1 — `architecture-diagram.tsx`

```tsx
export function ArchitectureDiagram() {
  return (
    <pre
      aria-label="GitControl request topology"
      className="overflow-x-auto border border-border bg-muted px-5 py-4 font-mono text-[12px] leading-relaxed text-foreground rounded-none"
    >
{`Browser ──HTTPS──▶ Next.js 16 (standalone, :3000)
                   ├─ Edge middleware (auth guard)
                   ├─ RSC + server actions
                   └─ /api/{auth/[...all], health, webhooks/release}
                         │
              ┌──────────┼──────────────┐
              ▼          ▼              ▼
        Postgres 16   Redis 7       github.com
        (Drizzle)    (ioredis,      (Octokit REST +
                      ETag store)    GraphQL,
                                     ETag-aware)`}
    </pre>
  );
}
```

### 5.2 — `architecture-section.tsx`

```tsx
<section id="architecture" className="mx-auto max-w-[96rem] px-4 py-24 md:px-6">
  <div className="mb-12 max-w-2xl">
    <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">ARCHITECTURE</p>
    <h2 className="mt-3 font-sans text-3xl tracking-tight md:text-4xl">Built for self-hosting. Tuned for your rate limit.</h2>
    <p className="mt-4 text-muted-foreground">Every external GitHub call is cached per user in Redis with ETag revalidation. The browser never talks to GitHub directly.</p>
  </div>

  <div className="grid gap-6 md:grid-cols-3">
    <FeatureCard icon={<Database size={24} strokeWidth={1.5} />}
      title="Per-user encrypted cache"
      description="Envelope cached as `{ body, etag, fetchedAt }` under key `gh:{userId}:{resource}:{paramHash}`. A 304 from GitHub refreshes the TTL only — no body transfer."
      meta="lib/github/cache.ts" />
    <FeatureCard icon={<Server size={24} strokeWidth={1.5} />}
      title="Server-rendered everything"
      description="Next.js 16 RSC + server actions. Page-level Suspense streams HTML to the browser. No JSON waterfalls, no client-side fetch in the dashboard."
      meta="app/(dashboard)" />
    <FeatureCard icon={<Cog size={24} strokeWidth={1.5} />}
      title="Lazy resource proxies"
      description="DB, Redis, and the auth instance are lazy-initialized. NEXT_PHASE=phase-production-build triggers env placeholder fallback so page-data collection never crashes."
      meta="lib/env.ts" />
  </div>

  <div className="mt-12">
    <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">REQUEST TOPOLOGY</p>
    <ArchitectureDiagram />
  </div>

  <div className="mt-12 grid gap-6 md:grid-cols-2">
    <div className="border border-border bg-card p-6">
      <h3 className="font-sans text-lg tracking-tight">Cache key shape</h3>
      <pre className="mt-3 border border-border bg-muted px-4 py-3 font-mono text-xs text-foreground rounded-none overflow-x-auto">{`gh:{userId}:{resource}:{sha256(JSON.stringify(params)).slice(0,16)}`}</pre>
      <p className="mt-3 text-sm text-muted-foreground">Two users hitting the same endpoint never share an envelope. Cross-tenant leakage impossible by construction.</p>
    </div>
    <div className="border border-border bg-card p-6">
      <h3 className="font-sans text-lg tracking-tight">Invalidation</h3>
      <p className="mt-3 text-sm text-muted-foreground"><code className="font-mono text-foreground">invalidate(userId, resource)</code> uses <code className="font-mono text-foreground">scanStream</code> + pipelined <code className="font-mono text-foreground">DEL</code>. No blocking <code className="font-mono text-foreground">KEYS</code>. Resource <code className="font-mono text-foreground">"*"</code> wipes the user's namespace — used by <code className="font-mono text-foreground">revokeAccessAction</code>.</p>
    </div>
  </div>
</section>
```

### 5.3 — `cache-ttl-table.tsx`

Real values from `src/lib/github/cache.ts` (per `docs/system-architecture.md` §5).

```tsx
const ROWS: Array<{ resource: string; ttl: string; note?: string }> = [
  { resource: "viewer",        ttl: "3600s",  note: "User profile rarely changes" },
  { resource: "repos · repo",  ttl: "300s" },
  { resource: "issues · prs",  ttl: "120s",   note: "Tightest TTL — triage-critical" },
  { resource: "commits",       ttl: "120s" },
  { resource: "stars",         ttl: "600s" },
  { resource: "orgs",          ttl: "1800s" },
  { resource: "packages",      ttl: "600s" },
  { resource: "projects",      ttl: "300s",   note: "GraphQL — no ETag" },
  { resource: "readme",        ttl: "1800s" },
  { resource: "languages",     ttl: "3600s" },
  { resource: "releases · tags", ttl: "1800s" },
  { resource: "contributors",  ttl: "3600s" },
  { resource: "heatmap",       ttl: "3600s" },
  { resource: "dependencies",  ttl: "600s" },
];

<section className="mx-auto max-w-[96rem] px-4 pb-24 md:px-6">
  <div className="mb-8 max-w-2xl">
    <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">CACHE TTL TABLE</p>
    <h3 className="mt-3 font-sans text-2xl tracking-tight">Tuned per resource.</h3>
    <p className="mt-3 text-sm text-muted-foreground">Pulled verbatim from <code className="font-mono text-foreground">lib/github/cache.ts</code>.</p>
  </div>
  <div className="border border-border bg-card">
    <div className="grid grid-cols-[1fr,120px,2fr] border-b border-border bg-muted px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
      <span>Resource</span><span>TTL</span><span>Note</span>
    </div>
    {ROWS.map(r => (
      <div key={r.resource} className="grid grid-cols-[1fr,120px,2fr] items-center border-b border-border px-4 py-2 last:border-b-0 text-sm">
        <code className="font-mono text-foreground">{r.resource}</code>
        <code className="font-mono text-primary">{r.ttl}</code>
        <span className="text-muted-foreground">{r.note ?? ""}</span>
      </div>
    ))}
  </div>
</section>
```

### 5.4 — `security-privacy-section.tsx`

```tsx
<section className="border-y border-border bg-card/30">
  <div className="mx-auto max-w-[96rem] px-4 py-24 md:px-6">
    <div className="mb-12 max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">SECURITY & PRIVACY</p>
      <h2 className="mt-3 font-sans text-3xl tracking-tight md:text-4xl">Your tokens never leave your disk in plaintext.</h2>
    </div>
    <div className="grid gap-6 md:grid-cols-3">
      <SecurityCard icon={<Lock />}
        title="Encrypted at rest"
        bullets={[
          "AES-256-GCM via node:crypto",
          "32-byte hex TOKEN_ENCRYPTION_KEY",
          "12-byte random IV per write",
          "Auth tag stored alongside ciphertext",
          "Plaintext column wiped post-handshake",
        ]} />
      <SecurityCard icon={<Users />}
        title="Per-user isolation"
        bullets={[
          "Cache keys prefixed by userId",
          "DB rows keyed by userId with cascade delete",
          "Octokit clients built per request, bound to one user's token",
          "Session cookies httpOnly + secure in production",
        ]} />
      <SecurityCard icon={<Server />}
        title="Your infrastructure"
        bullets={[
          "Single VPS, single Next instance",
          "Only outbound calls go to api.github.com",
          "Postgres + Redis are Dokploy-managed",
          "Health probe at /api/health flips to 503 on store failure",
        ]} />
    </div>
  </div>
</section>
```

`SecurityCard`:
```tsx
<article className="border border-border bg-background p-6">
  <div className="text-primary mb-4">{icon /* size 24 stroke 1.5 */}</div>
  <h3 className="font-sans text-lg tracking-tight">{title}</h3>
  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
    {bullets.map(b => <li key={b} className="flex gap-2"><Check className="size-4 text-primary mt-0.5 shrink-0" />{b}</li>)}
  </ul>
</article>
```

### 5.5 — Wire into landing-page.tsx

Append `<ArchitectureSection />`, `<CacheTtlTable />`, `<SecurityPrivacySection />` in order after `<DashboardTourSection />`.

## Todo List

- [ ] `architecture-diagram.tsx` renders ASCII topology, horizontally scrollable on mobile
- [ ] `architecture-section.tsx` with 3 feature cards + 2-column sub-panel for cache key + invalidation
- [ ] `cache-ttl-table.tsx` with all 14 rows, real TTLs
- [ ] `security-privacy-section.tsx` with 3 SecurityCard columns
- [ ] `landing-page.tsx` updated
- [ ] `pnpm build` passes
- [ ] Verify every TTL number matches `lib/github/cache.ts` (open the file and diff)

## Success Criteria

- Architecture diagram renders monospaced with proper line alignment.
- Cache TTL table is sortable visually (consistent grid columns) and readable on mobile (table horizontally compact, wraps if needed).
- Security section icons render in `text-primary` with clear separation.
- All numeric claims match source files.

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| ASCII diagram breaks on narrow screens | `overflow-x-auto` on the `<pre>`. Diagram is left-anchored so horizontal scroll feels natural. |
| TTL values drift from source over time | Add a code comment in `cache-ttl-table.tsx`: `// SYNC: keep in sync with src/lib/github/cache.ts`. |

## Security Considerations

- None. Static content describes existing security model.

## Next Steps

- Phase 6 adds conversion sections (comparison, self-hosting commands, roadmap, FAQ).
