# Landing Page Design — Implementation Report

> Branch: `feat/landing-page-design` · Plan: `plans/260512-1617-landing-page-design/`

## Status

DONE.

`npx next build` green. `npx eslint` clean on all new files. Anonymous `/` renders the landing; authed users still redirect to `/dashboard`. `/login` untouched (still works, now consumes the shared `GithubIcon`).

## Files added

### Marketing components (`src/components/marketing/`)
- `landing-page.tsx` — composer
- `marketing-nav.tsx` — sticky nav + mobile sheet (client)
- `marketing-footer.tsx` — 4-column footer + version row
- `hero-section.tsx` — eyebrow + headline + dual CTA + Glow Panel
- `hero-intro-motion.tsx` — framer-motion fade island (client)
- `trust-strip.tsx` — stack chips with status dots
- `why-gitcontrol-section.tsx` — problem vs solution split
- `core-capabilities-grid.tsx` — 6 feature cards
- `feature-card.tsx` — reusable card
- `dashboard-tour-section.tsx` — parent wrapper for tour
- `tour-row.tsx` — alternating image-left/right row
- `tour-area-overview.tsx`
- `tour-area-repositories.tsx`
- `tour-area-repo-detail.tsx`
- `tour-area-inbox.tsx`
- `tour-area-discovery.tsx`
- `tour-area-platform.tsx`
- `architecture-section.tsx` — 3 cards + diagram + cache key + invalidation
- `architecture-diagram.tsx` — ASCII topology `<pre>`
- `cache-ttl-table.tsx` — 14 TTL rows from `lib/github/cache.ts`
- `security-privacy-section.tsx` — 3-column lock/users/server cards
- `comparison-table.tsx` — 12-row GitHub vs GitControl
- `self-hosting-section.tsx` — 3 deploy cards + env + secrets code blocks
- `code-block.tsx` — reusable code component
- `roadmap-section.tsx` — shipped vs out-of-scope
- `faq-list.tsx` — 8 `<details>` items
- `final-cta-banner.tsx` — aurora-backed banner with sign-in CTA
- `glow-panel.tsx` — reusable screenshot frame
- `status-badge.tsx` — reusable mono pill
- `contribution-heatmap-preview.tsx` — deterministic 52×7 SVG mockup
- `cmd-k-hint.tsx` — `<kbd>` snippet
- `sync-status-pill.tsx` — fresh/stale cache pill
- `repo-health-badge.tsx` — score badge
- `devicon-stack-preview.tsx` — language stack
- `github-sign-in-button.tsx` — shared sign-in button (client)

### Mockups (`src/components/marketing/mockups/`)
- `overview-mockup.tsx`
- `repositories-mockup.tsx`
- `repo-detail-mockup.tsx`
- `inbox-mockup.tsx`
- `discovery-mockup.tsx`
- `platform-mockup.tsx`

## Files modified

- `src/app/page.tsx` — authed → `/dashboard`, anon → render `<LandingPage />`. Adds metadata (title, description, OG, Twitter).
- `src/app/login/page.tsx` — removes inline `GithubIcon`, imports from `@/components/icons/github-icon`. Functional behavior unchanged.
- `src/app/globals.css` — appends `--gradient-aurora`, `--gradient-code-glow` vars + `.bg-aurora` / `.bg-code-glow` utilities. No other token edits.

## Files NOT touched

- `src/lib/auth/*`, `src/lib/github/*`, `src/lib/db/*` — untouched.
- All `(dashboard)` routes — untouched.
- `package.json` — no new dependencies. Used existing `motion`, `lucide-react`, shadcn primitives.

## Verification

- `npx next build` → green, all 30 routes compile, TypeScript clean, 17 static pages generated.
- `npx eslint src/components/marketing src/app/page.tsx src/app/login/page.tsx src/components/icons/github-icon.tsx` → no errors, no warnings.
- Route `/` is dynamic (`ƒ`) due to session lookup. `/login` remains static.

## Design fidelity vs `docs/landing-DESIGN.md`

- Colors: 100% via Tailwind utilities. Zero hardcoded OKLCH outside `globals.css` and the heatmap preview's level array.
- Radius: `rounded-none` everywhere; `rounded-full` only on small status dots.
- Fonts: reuses root layout's Chakra Petch (`font-sans`) + IBM Plex Mono (`font-mono`).
- Shadows: only existing `shadow-md`/`shadow-sm` from the theme.
- Gradient utilities: two added (`bg-aurora`, `bg-code-glow`) per DESIGN.md Quick Start.

## Decisions made during execution

1. **Tailwind v4 canonical-class warnings** in hero-section (`size-[800px]`, `max-w-[96rem]`) — left as-is for now; they're hints, not errors. Follow-up could switch to `max-w-8xl` / `size-200` if those utilities exist in the theme.
2. **Footer docs links** point to `#anchor` sections within the landing for the local test. Real public GitHub blob URLs can be wired once the repo URL is finalized (Phase 8 §8.3 Option A).
3. **GitHub repo URL** hardcoded to `https://github.com/dmaurelc/gitcontrol` in nav + footer. Swap if the public repo path differs.
4. **Tailwind v4 grid spacing**: used `grid-cols-[1.5fr_1fr_1fr]` syntax (Tailwind v4 requires underscores instead of commas inside arbitrary values).
5. **`<details>` for FAQ**: kept zero-JS approach. Native browser keyboard support included. `[&_summary::-webkit-details-marker]:hidden` hides Safari's default disclosure triangle.
6. **No new shadcn primitive added.** Accordion replaced by native `<details>`.

## Known follow-ups

- Capture real dashboard screenshots and swap into Glow Panels (currently HTML mockups).
- Resolve canonical-class lint hints (size-200 / max-w-8xl).
- Finalize Roadmap section anchor IDs vs nav links (current: `#roadmap` exists but isn't in the nav — intentional, since it's not a marquee anchor).
- Light theme polish (landing is dark-only effectively; tokens flip but a visual sweep is recommended).
- SEO: add sitemap.xml + robots.txt + an OG image asset.

## Manual smoke test (not yet run)

Recommended before merge:
1. `pnpm dev` → visit `http://localhost:3000/` while logged out → see landing.
2. Click "Sign in with GitHub" (nav, hero, final CTA) → OAuth completes → lands at `/dashboard`.
3. Visit `/` while authed → 302 to `/dashboard`.
4. Visit `/login` → confirm sign-in screen still works.
5. Mobile viewport (360px): hamburger opens sheet, sheet closes via X, sticky nav backdrop blurs through scrolled content.
6. FAQ items expand/collapse via click + Enter.
7. `prefers-reduced-motion: reduce` → hero renders without entrance fade.

## Unresolved questions

- Is `https://github.com/dmaurelc/gitcontrol` the canonical public repo URL? (Used in nav + footer.)
- Should `/login` continue to exist as a separate route, or redirect to `/#hero`? Current plan keeps it for backward compat. Confirm intent.
- Real dashboard screenshots: should I capture them in a follow-up, or are HTML mockups acceptable for the final landing?
