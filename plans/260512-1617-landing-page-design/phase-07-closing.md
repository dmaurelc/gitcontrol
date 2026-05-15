# Phase 7 — Closing (Final CTA Banner · Footer)

## Context Links

- [docs/landing-DESIGN.md](../../docs/landing-DESIGN.md) — Footer, Status Badge, Aurora gradient specs
- Phase 1 output: `GithubSignInButton`
- Phase 2 output: `StatusBadge`

## Overview

- **Priority:** P0 (every long page needs a strong terminal action + scannable site map)
- **Status:** Pending
- **Brief:** Full-bleed banner with aurora orb that hosts the final sign-in CTA, followed by a 4-column footer with the canonical site links + version badge + tagline.

## Key Insights

- The user has now read everything they need to decide. Final CTA must be a single primary green action with no competing decoration.
- Footer doubles as a docs map — every authoritative doc lives in `docs/` and visitors should know where to find them.
- The version badge in the footer ("v0.9.3 · MVP shipped May 2026") proves the project is alive without needing a separate "Last updated" timestamp.

## Requirements

### Functional

- `<FinalCtaBanner>` — full-bleed `bg-card` band, aurora orb backdrop, display headline, subhead, primary `GithubSignInButton` + ghost "Read the architecture docs" link.
- `<MarketingFooter>` — 4 link columns (Product · Docs · Resources · Legal), bottom row with wordmark + version badge + tagline.

### Non-functional

- RSC.
- ≤200 LOC per file.
- Footer links open external URLs in new tab where appropriate (`rel="noreferrer noopener"`).

## Architecture

```
src/components/marketing/
  final-cta-banner.tsx
  marketing-footer.tsx
```

## Related Code Files

### To create

- `src/components/marketing/final-cta-banner.tsx`
- `src/components/marketing/marketing-footer.tsx`

### To modify

- `src/components/marketing/landing-page.tsx` — append `<FinalCtaBanner />` then `<MarketingFooter />` at the end.

## Implementation Steps

### 7.1 — `final-cta-banner.tsx`

```tsx
<section className="relative isolate overflow-hidden border-y border-border bg-card">
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-aurora opacity-15 blur-3xl" />
  <div className="mx-auto flex max-w-[96rem] flex-col items-start gap-8 px-4 py-24 md:px-6 lg:flex-row lg:items-center lg:justify-between">
    <div className="max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">READY</p>
      <h2 className="mt-3 font-sans text-4xl tracking-tighter md:text-5xl">Take back your dashboard.</h2>
      <p className="mt-4 text-muted-foreground">
        GitControl runs on your server. Your tokens stay encrypted on your disk.
        Your workflow is yours again.
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <GithubSignInButton size="lg" />
      <Button asChild variant="outline" size="lg" className="rounded-none">
        <a href="#architecture">Read the architecture</a>
      </Button>
    </div>
  </div>
</section>
```

If the `#architecture` anchor on the same page is acceptable, link there. If a real external docs URL becomes available later, swap the href; the component takes a single href so no further refactor is needed.

### 7.2 — `marketing-footer.tsx`

```tsx
const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Dashboard tour", href: "#dashboard-tour" },
      { label: "Architecture", href: "#architecture" },
      { label: "Self-hosting", href: "#self-hosting" },
      { label: "Roadmap", href: "#" /* roadmap section anchor TBD */ },
    ],
  },
  {
    title: "Docs",
    links: [
      { label: "Project overview", href: "/docs/project-overview-pdr.md" },
      { label: "System architecture", href: "/docs/system-architecture.md" },
      { label: "Deployment guide", href: "/docs/deployment-guide.md" },
      { label: "Codebase summary", href: "/docs/codebase-summary.md" },
      { label: "Code standards", href: "/docs/code-standards.md" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Live demo", href: "https://dev.webkode.cl", external: true },
      { label: "Changelog", href: "/changelog" },
      { label: "Report a bug", href: "/report-bug" },
      { label: "GitHub OAuth scopes", href: "#faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "License (private)", href: "#faq" },
      { label: "Privacy", href: "#faq" },
    ],
  },
] as const;

<footer className="border-t border-border bg-background">
  <div className="mx-auto max-w-[96rem] px-4 py-16 md:px-6">
    <div className="grid gap-10 md:grid-cols-4">
      {COLUMNS.map(col => (
        <div key={col.title}>
          <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-foreground">{col.title}</h3>
          <ul className="mt-4 space-y-2">
            {col.links.map(link => (
              <li key={link.label}>
                <a
                  href={link.href}
                  {...("external" in link && link.external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 md:flex-row md:items-center">
      <div className="flex items-center gap-3">
        <span className="font-sans text-lg font-semibold tracking-tight">GitControl</span>
        <span className="text-primary animate-pulse">▌</span>
        <StatusBadge tone="primary">v0.9.3 · MVP shipped May 2026</StatusBadge>
      </div>
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Made for developers who self-host.</p>
    </div>
  </div>
</footer>
```

> Note: `/docs/*` links above are placeholders. The repo doesn't currently serve docs files over HTTP. Acceptable for the local test build; replace with the public GitHub blob URLs (e.g. `https://github.com/<owner>/<repo>/blob/main/docs/...`) once the repo origin is finalized. Track in Phase 8.

### 7.3 — Wire into landing-page.tsx

Append `<FinalCtaBanner />` and `<MarketingFooter />` as the last two children inside `<main>`.

## Todo List

- [ ] `final-cta-banner.tsx` with aurora orb backdrop and 2 CTAs
- [ ] `marketing-footer.tsx` with 4 columns + bottom version row
- [ ] `landing-page.tsx` updated
- [ ] `pnpm build` passes
- [ ] Manual QA: anchor links scroll to the correct sections; external links open in new tab

## Success Criteria

- Banner spans full viewport width with the aurora orb visible behind content but not overwhelming.
- Footer collapses 4 columns → 1 column on mobile, version row stacks below.
- "Made for developers who self-host" tagline renders in mono uppercase muted text.
- Cursor blink (▌) animates next to wordmark.

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Docs links 404 in local test | Mark them with placeholder hrefs that scroll to `#faq` until the public docs URL is known. Phase 8 review surfaces this. |

## Security Considerations

- External link `rel="noreferrer noopener"` is required and applied to the live-demo URL.

## Next Steps

- Phase 8 polishes motion, runs a11y/responsive QA, and verifies the build.
