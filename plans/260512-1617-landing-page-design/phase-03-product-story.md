# Phase 3 — Product Story (Why GitControl · Core Capabilities Grid)

## Context Links

- [docs/landing-DESIGN.md](../../docs/landing-DESIGN.md) — Feature Card, Comparison Row Table specs
- [docs/project-overview-pdr.md](../../docs/project-overview-pdr.md) §2 Problem Statement, §4 Functional Requirements
- [docs/system-architecture.md](../../docs/system-architecture.md) §2 Request Flow, §4 Token Storage, §6 Multi-User Isolation

## Overview

- **Priority:** P0 (motivates the rest of the page)
- **Status:** Pending
- **Brief:** Two sections — Problem/Solution split and a 6-card grid of core capabilities. Together they answer "what is this and why should I care" before the deep dives.

## Key Insights

- Avoid generic SaaS framing. Lead with concrete pain points the dashboard solves: page reload on org switch, no server-side cache, plaintext credentials in third-party UIs.
- Tie each capability card to a real module / route. Vague feature copy reads as marketing noise.
- This section anchors `#features` referenced by the nav.

## Requirements

### Functional

- Section `<WhyGitcontrolSection>` anchored at `#why`. Two-card split, left red-toned ("GitHub's default UI"), right primary-toned ("GitControl"). Each card holds a list of 5 line items with appropriate check / X icons.
- Section `<CoreCapabilitiesGrid>` anchored at `#features`. 6 feature cards in a responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.
- Each feature card uses a Lucide icon stroke 1.5px, a font-sans title, and `text-muted-foreground` body copy.

### Non-functional

- Pure RSC. No client islands.
- All copy English. Concrete, accurate to docs.
- ≤200 LOC per file.

## Architecture

```
src/components/marketing/
  why-gitcontrol-section.tsx
  core-capabilities-grid.tsx
  feature-card.tsx               (extracted reusable, used by core grid + later phases)
```

`landing-page.tsx` appends both sections after `<TrustStrip />`.

## Related Code Files

### To create

- `src/components/marketing/feature-card.tsx`
- `src/components/marketing/why-gitcontrol-section.tsx`
- `src/components/marketing/core-capabilities-grid.tsx`

### To modify

- `src/components/marketing/landing-page.tsx` — append both sections.

## Implementation Steps

### 3.1 — `feature-card.tsx`

Reusable card matching DESIGN.md Feature Card spec.
```tsx
type Props = {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  meta?: React.ReactNode;   // optional small mono footer (e.g. "lib/github/cache.ts")
};

<article className="group flex flex-col gap-3 border border-border bg-card p-6 transition-colors hover:border-primary hover:shadow-sm">
  <div className="text-primary">{icon /* size 24 stroke 1.5 */}</div>
  <h3 className="font-sans text-xl font-medium tracking-tight text-foreground">{title}</h3>
  <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
  {meta && <p className="mt-auto pt-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground/70">{meta}</p>}
</article>
```

### 3.2 — `why-gitcontrol-section.tsx`

```tsx
<section id="why" className="border-y border-border bg-card/30">
  <div className="mx-auto max-w-[96rem] px-4 py-24 md:px-6">
    <div className="mb-12 max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">WHY GITCONTROL</p>
      <h2 className="mt-3 font-sans text-3xl tracking-tight md:text-4xl">GitHub's UI wasn't built for daily ops.</h2>
      <p className="mt-4 text-muted-foreground">A focused dashboard for people who live in their repos every day.</p>
    </div>
    <div className="grid gap-6 md:grid-cols-2">
      <ProblemCard />
      <SolutionCard />
    </div>
  </div>
</section>
```

`ProblemCard`: `border border-border bg-background p-6`. Title `font-sans text-lg`. List items use `<X className="size-4 text-destructive shrink-0" />`. Items (copy verbatim):
- Broad UI optimized for discovery, not daily ops
- Multi-org context switch reloads the page
- No server-side cache — every navigation burns rate limit
- Browser-only — preferences live in localStorage
- Your data sits on someone else's server

`SolutionCard`: same shell, `border-primary/40`. Title `text-primary`. Check icons `<Check className="size-4 text-primary shrink-0" />`. Items:
- Dense, opinionated, Linear-style information density
- Personal ↔ org switch via httpOnly cookie, no reload
- Octokit calls cached in Redis with ETag revalidation, 60s–1h TTLs
- Preferences (pinned repos, theme, view mode) persisted in Postgres
- Your VPS, your encrypted tokens (AES-256-GCM), your data

### 3.3 — `core-capabilities-grid.tsx`

```tsx
<section id="features" className="mx-auto max-w-[96rem] px-4 py-24 md:px-6">
  <div className="mb-12 max-w-2xl">
    <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">CORE CAPABILITIES</p>
    <h2 className="mt-3 font-sans text-3xl tracking-tight md:text-4xl">Six pillars, one dashboard.</h2>
    <p className="mt-4 text-muted-foreground">Every capability backed by a concrete module in the codebase.</p>
  </div>
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {CAPABILITIES.map(c => <FeatureCard key={c.title} {...c} />)}
  </div>
</section>
```

`CAPABILITIES` (6 entries, exact copy):

| # | Icon (Lucide) | Title | Description | Meta |
|---|---------------|-------|-------------|------|
| 1 | `ShieldCheck` | GitHub OAuth, encrypted | Better Auth + Drizzle adapter. AES-256-GCM at rest with a 32-byte hex key. The plaintext token column is wiped immediately after the OAuth callback by a databaseHooks.account.create.after hook. | `lib/auth/encryption.ts` |
| 2 | `DatabaseZap` | Per-user Redis cache | Keys namespaced `gh:{userId}:{resource}:{paramHash}`. ETag revalidation: a 304 from GitHub refreshes the TTL without re-fetching the body. >70% hit rate target. | `lib/github/cache.ts` |
| 3 | `Users` | Multi-context switcher | Toggle between your personal account and any org you belong to. The active context cookie is validated against your real org list on every page render to defend against stale state. | `lib/context/active-context.ts` |
| 4 | `Command` | Cmd+K command palette | Fuzzy index of every org and repo in the active context. Jump anywhere without clicking through the sidebar. Powered by cmdk. | `app/(dashboard)/_components` |
| 5 | `Server` | Server-first rendering | Next.js 16 RSC + server actions. The browser receives HTML, not JSON waterfalls. Standalone Docker output, ~250 MB runner image. | `next.config.ts` |
| 6 | `Container` | Self-hosted on Dokploy | Multi-stage Dockerfile, separate migrator stage, idempotent Drizzle migrations on startup, /api/health probe wired for Dokploy. | `Dockerfile · scripts/entrypoint.sh` |

Render each as `<FeatureCard icon={<Icon className="size-6" strokeWidth={1.5} />} title={...} description={...} meta={<>{meta}</>} />`.

### 3.4 — Wire into landing-page.tsx

Append `<WhyGitcontrolSection />` then `<CoreCapabilitiesGrid />` after `<TrustStrip />`.

## Todo List

- [ ] `feature-card.tsx` reusable, tested visually in isolation
- [ ] `why-gitcontrol-section.tsx` with both Problem and Solution cards
- [ ] `core-capabilities-grid.tsx` with all 6 capabilities + correct icons
- [ ] Imports added to `landing-page.tsx`
- [ ] `pnpm build` passes
- [ ] Responsive QA: grid collapses to 1 / 2 / 3 columns at correct breakpoints

## Success Criteria

- Problem card visibly red-accented via `text-destructive` icons; Solution card visibly primary-accented.
- Grid renders 6 cards with distinct Lucide icons in `text-primary`.
- All meta footers render in mono uppercase muted text.
- Section IDs `#why` and `#features` reachable via nav anchor links from Phase 2.
- No layout shift; cards have consistent height within a row.

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Cards different heights cause ragged rows | Use `flex flex-col` + `mt-auto pt-2` on meta to push it to the bottom; equalize via grid item alignment. |
| Icon import bloat | Use named imports from `lucide-react`; tree-shaking handles the rest. |

## Security Considerations

- None. Static content.

## Next Steps

- Phase 4 deep-dives each dashboard route under `#dashboard-tour`.
