# Phase 2 — Above the Fold (Nav · Hero · Trust Strip)

## Context Links

- [docs/landing-DESIGN.md](../../docs/landing-DESIGN.md) — Nav Bar, Glow Panel, Status Badge, Contribution Heatmap Preview, Cmd+K Trigger specs
- [docs/project-overview-pdr.md](../../docs/project-overview-pdr.md) — product positioning copy
- Phase 1 output: `GithubSignInButton`, `landing-page.tsx` stub

## Overview

- **Priority:** P0 (first impression — drives sign-in)
- **Status:** Pending
- **Brief:** Build sticky marketing nav with mobile sheet, two-column hero with eyebrow + display headline + dual CTA + Glow Panel screenshot mockup, and trust strip of stack chips.

## Key Insights

- Hero must communicate the entire value prop in one screen height on desktop: "self-hosted GitHub dashboard, encrypted, per-user cache, multi-context."
- Use the 365-day Contribution Heatmap Preview as the headline screenshot — it's the most visually distinctive piece of the dashboard.
- The Cmd+K hint reinforces the "developer tool" identity and previews a real feature.
- Nav links scroll to anchor sections defined in later phases (`#features`, `#dashboard-tour`, `#architecture`, `#self-hosting`, `#faq`).

## Requirements

### Functional

- Nav: sticky at top, backdrop blur, wordmark + 5 anchor links + ghost "View on GitHub" + primary "Sign in with GitHub".
- Mobile (≤768px): hamburger toggle reveals a sheet panel with the same links stacked + sign-in CTA at the bottom.
- Hero: mono eyebrow, display headline, subhead with `⌘K` kbd hint, primary `GithubSignInButton` (size lg), ghost "Open live demo →" linking https://dev.webkode.cl, version status badge, Glow Panel screenshot.
- Trust strip: row of monospaced stack chips separated by `text-primary` status dots.
- All content statically rendered; only the nav sheet + sign-in button are client islands.

### Non-functional

- Server Component composition. Client islands isolated to `marketing-nav.tsx` (sheet toggle) and `github-sign-in-button.tsx` (existing from Phase 1).
- Mobile-first responsive at 640 / 768 / 1024 / 1280.
- Lighthouse: zero CLS; reserve heatmap dimensions.
- Each component file ≤200 LOC.

## Architecture

```
src/components/marketing/
  marketing-nav.tsx           ("use client" — sheet toggle, scroll links)
  hero-section.tsx            (RSC — composition only)
  trust-strip.tsx             (RSC)
  glow-panel.tsx              (RSC — reusable frame)
  status-badge.tsx            (RSC — reusable mono pill)
  contribution-heatmap-preview.tsx (RSC — static SVG mockup)
  cmd-k-hint.tsx              (RSC — <kbd> snippet)
```

`landing-page.tsx` updates: import + render `<MarketingNav />`, `<HeroSection />`, `<TrustStrip />` in order. Wrap in `<main>` with the existing `min-h-svh bg-background text-foreground`.

## Related Code Files

### To create

- `src/components/marketing/marketing-nav.tsx`
- `src/components/marketing/hero-section.tsx`
- `src/components/marketing/trust-strip.tsx`
- `src/components/marketing/glow-panel.tsx`
- `src/components/marketing/status-badge.tsx`
- `src/components/marketing/contribution-heatmap-preview.tsx`
- `src/components/marketing/cmd-k-hint.tsx`

### To modify

- `src/components/marketing/landing-page.tsx` — import + render the three sections.

## Implementation Steps

### 2.1 — `status-badge.tsx`

Reusable mono pill matching the Status Badge spec.
```tsx
type Props = { children: React.ReactNode; tone?: "primary" | "neutral"; className?: string };
```
`primary` → `bg-secondary text-primary border border-border`. `neutral` → `bg-muted text-muted-foreground border border-border`. Always: `inline-flex items-center gap-2 px-2 py-0.5 font-mono text-xs uppercase tracking-wider rounded-none`. Includes optional `<span className="size-2 rounded-full bg-primary" />` when tone="primary".

### 2.2 — `cmd-k-hint.tsx`

Inline `<kbd>` pair. `<span className="inline-flex items-center gap-1 font-mono text-xs">` wrapping `<kbd className="border border-border bg-muted px-1.5 py-0.5">⌘</kbd>` + `<kbd className="border border-border bg-muted px-1.5 py-0.5">K</kbd>`.

### 2.3 — `glow-panel.tsx`

Reusable screenshot frame.
```tsx
<div className="relative">
  <div aria-hidden className="pointer-events-none absolute -inset-8 -z-10 bg-code-glow opacity-60 blur-2xl" />
  <div className="relative border border-border bg-card p-2">
    {children}
  </div>
</div>
```

### 2.4 — `contribution-heatmap-preview.tsx`

Static SVG. 52 columns × 7 rows of 11px squares, 2px gap, viewBox `0 0 691 95`. Fill 5 levels: `0/8/25/45/70/100%` opacity of `var(--primary)`. Use a deterministic seed (e.g. `(col*7+row) % 6`) so the pattern looks plausible without being random per render. Wrap in a small bg-card container with a year-selector pill above (`<StatusBadge tone="neutral">2026</StatusBadge>`).

### 2.5 — `marketing-nav.tsx` (`"use client"`)

Structure:
```tsx
<header className="sticky top-0 z-40 border-b border-sidebar-border bg-background/70 backdrop-blur">
  <div className="mx-auto flex h-16 max-w-[96rem] items-center justify-between px-4 md:px-6">
    <a href="/" className="flex items-center gap-2 font-sans text-lg font-semibold tracking-tight">
      GitControl
      <span className="text-primary animate-pulse">▌</span>
    </a>
    <nav className="hidden items-center gap-6 lg:flex">
      {NAV_LINKS.map(...)}
    </nav>
    <div className="hidden items-center gap-2 lg:flex">
      <Button variant="outline" asChild className="rounded-none"><a href={GITHUB_REPO}>View on GitHub</a></Button>
      <GithubSignInButton size="default" />
    </div>
    <button className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu /></button>
  </div>
  {open && <MobileSheet onClose={() => setOpen(false)} />}
</header>
```

Anchor links: `Features` → `#features`, `Dashboard tour` → `#dashboard-tour`, `Architecture` → `#architecture`, `Self-hosting` → `#self-hosting`, `FAQ` → `#faq`.

Mobile sheet: full-screen fixed overlay `bg-background` with the same links + sign-in CTA. Use a plain `<div>` + `useState`, no Radix dialog — avoid new deps.

### 2.6 — `trust-strip.tsx`

Single horizontal row, mono uppercase text, dot separators:
```tsx
<div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-y border-border bg-card/40 px-4 py-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">
  <span>Next.js 16</span>
  <Dot /> <span>Postgres 16</span> <Dot /> <span>Redis 7</span>
  <Dot /> <span>Better Auth</span> <Dot /> <span>Octokit</span>
  <Dot /> <span>Dokploy</span> <Dot /> <span>Tailwind v4</span>
</div>
```
`<Dot />` = `<span className="size-1 rounded-full bg-primary" aria-hidden />`.

### 2.7 — `hero-section.tsx`

Two-column layout at ≥1024px, single column below.

Left column:
- Eyebrow (`StatusBadge tone="primary"`): `SELF-HOSTED · OPEN SOURCE · v0.9.3 · MVP SHIPPED`
- Display headline (`<h1>`): `Your GitHub. Your server. Your dashboard.`
  - Classes: `font-sans text-5xl tracking-tighter leading-[1.05] text-foreground md:text-6xl xl:text-7xl`
- Subhead `<p className="mt-6 max-w-xl text-lg text-muted-foreground">`:
  > A self-hosted, multi-user replacement for github.com's UI. Encrypted OAuth tokens, per-user Redis cache with ETag revalidation, and full coverage of repos, issues, pulls, stars, projects, and packages — without ever leaving your VPS.
- Helper row: `<CmdKHint />` + `<span>to jump between orgs and repos.</span>` in `text-sm text-muted-foreground`.
- CTA row (`mt-8 flex flex-wrap items-center gap-3`):
  - `<GithubSignInButton size="lg" />`
  - `<Button asChild variant="outline" size="lg" className="rounded-none"><a href="https://dev.webkode.cl">Open live demo →</a></Button>`

Right column (Glow Panel):
- `<GlowPanel>` wrapping a mockup that renders 4 KPI tiles in a grid (Repos · Stars · Open PRs · Open issues) above the `<ContributionHeatmapPreview />`.
- KPI tile: `border border-border bg-background p-4`; label `text-[11px] font-mono uppercase tracking-wider text-muted-foreground`; value `mt-2 font-sans text-3xl tracking-tight text-foreground`.

Section wrapper:
```tsx
<section className="relative isolate overflow-hidden">
  <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 -z-10 size-[800px] -translate-x-1/2 bg-aurora opacity-20 blur-3xl" />
  <div className="mx-auto max-w-[96rem] px-4 py-24 md:px-6 md:py-32 lg:grid lg:grid-cols-2 lg:gap-12">
    {/* left + right */}
  </div>
</section>
```

### 2.8 — Wire into `landing-page.tsx`

Append imports + render `<MarketingNav />`, `<HeroSection />`, `<TrustStrip />` inside `<main>`.

## Todo List

- [ ] `status-badge.tsx` built and reusable
- [ ] `cmd-k-hint.tsx` built
- [ ] `glow-panel.tsx` built
- [ ] `contribution-heatmap-preview.tsx` built with deterministic SVG fill
- [ ] `marketing-nav.tsx` built with desktop + mobile sheet
- [ ] `trust-strip.tsx` built
- [ ] `hero-section.tsx` built with two-column layout + aurora orb backdrop
- [ ] `landing-page.tsx` updated to render the three sections
- [ ] `pnpm build` passes
- [ ] Manual responsive QA at 360 / 768 / 1024 / 1440 widths

## Success Criteria

- Hero renders single-column on mobile, two-column ≥1024px.
- Heatmap preview is visually plausible (not all same color).
- Cmd+K hint visible and properly styled.
- Mobile hamburger opens a full-screen sheet; closes via close button or backdrop tap.
- Sticky nav stays at top through scroll; backdrop blur visible when content scrolls under it.
- Sign-in CTA in both the nav and the hero triggers OAuth and lands on `/dashboard`.
- Trust strip wraps gracefully at small widths.

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Aurora orb causes mobile perf issues | Use `blur-3xl` + low opacity; orb is a single absolutely-positioned div, GPU-accelerated. |
| Mobile sheet without Radix lacks focus trap | Acceptable for marketing page; add `aria-modal` + `role="dialog"` on the sheet root, restore focus on close. |
| Heatmap SVG bloats RSC payload | Static SVG, ~6KB serialized — negligible. |

## Security Considerations

- External link to live demo uses `rel="noreferrer noopener"` on the anchor.
- No user input on this page; no XSS surface.

## Next Steps

- Phase 3 fills the section anchor `#features` with the Why GitControl split + Core Capabilities Grid.
