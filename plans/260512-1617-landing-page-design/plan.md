# Landing Page Design — Plan Overview

> Branch: `feat/landing-page-design` · Target: replace `/login` with public landing that includes sign-in trigger. Local test only.

## Context

GitControl currently routes anonymous visitors to `/login` (a minimal centered sign-in screen). Goal: replace it with a full informative landing at `/` that documents every dashboard capability and includes one or more `signIn.social({provider:"github"})` buttons.

Design source of truth: [docs/landing-DESIGN.md](../../docs/landing-DESIGN.md).
Product source of truth:
- [docs/project-overview-pdr.md](../../docs/project-overview-pdr.md)
- [docs/system-architecture.md](../../docs/system-architecture.md)
- [docs/codebase-summary.md](../../docs/codebase-summary.md)
- [docs/deployment-guide.md](../../docs/deployment-guide.md)

## Current state vs target state

| Aspect | Current | Target |
|--------|---------|--------|
| `/` (root) | RSC redirect to `/login` or `/dashboard` | RSC: authed → `/dashboard`; anon → render landing |
| `/login` | Minimal GitHub sign-in screen (kept) | Same, untouched — backward compat |
| Public marketing | None | Hero, tour, architecture, comparison, security, self-host, FAQ, footer |
| Sign-in entry points | `/login` only | 3 (nav, hero, final CTA), all calling `signIn.social({provider:"github", callbackURL:"/dashboard"})` |

## Stack confirmed against package.json (v0.9.3)

- Next 16.2.5 · React 19.2.4 · Tailwind v4 (`@tailwindcss/postcss`)
- shadcn primitives present: Button, Card, Badge, Dialog, Dropdown, Popover, Separator, Tabs, Avatar, Input, Label, Skeleton, Command, Magic Card
- shadcn primitives **missing**: **Accordion** — add via `pnpm dlx shadcn@latest add accordion` OR hand-roll with `@radix-ui/react-accordion` (need new dep) OR use semantic `<details>` (no JS island, no dep cost — recommended)
- `motion` v12 available for entrance animations
- `cmdk` available (already used by Cmd+K palette in app)
- `lucide-react` ^1.14.0 confirmed
- No `src/middleware.ts`; auth guard lives in `app/(dashboard)/layout.tsx` via `auth.api.getSession`. Landing route stays public — no guard needed.

## Phases

| # | Title | Status |
|---|-------|--------|
| 1 | Foundation: route, layout, fonts, shared sign-in button, gradient utilities | Pending |
| 2 | Above-the-fold: sticky nav, hero, trust strip | Pending |
| 3 | Product story: why GitControl, core capabilities grid | Pending |
| 4 | Dashboard tour: deep-dive sections for every route | Pending |
| 5 | Technical detail: architecture diagram, cache TTL table, security & privacy | Pending |
| 6 | Conversion: comparison table, self-hosting code blocks, roadmap, FAQ | Pending |
| 7 | Closing: final CTA banner, footer | Pending |
| 8 | Polish: motion, responsive QA, a11y pass, build verification | Pending |

Detailed phase files live alongside this plan.

## Key dependencies + decisions

- **Routing**: keep landing at `/` via existing `src/app/page.tsx`. Replace the `redirect("/login")` branch with the landing composition (a Server Component that imports `src/components/marketing/*`). Authed branch still redirects to `/dashboard`.
- **No new color tokens**. Reuse OKLCH vars from `src/app/globals.css`. Add only two landing-local utilities (`bg-aurora`, `bg-code-glow`) inside `@layer utilities` in `globals.css`.
- **Fonts unchanged**. Root layout already wires `--font-chakra-petch` + `--font-ibm-plex-mono` → `font-sans` / `font-mono`.
- **Sharp corners everywhere**. `rounded-none` on every box. Only `rounded-full` on tiny status dots.
- **Sign-in button** lives at `src/components/marketing/github-sign-in-button.tsx` ("use client"). Also extract the SVG from `src/app/login/page.tsx` to `src/components/icons/github-icon.tsx` so both pages share it.
- **Accordion**: use semantic `<details>` styled to match `docs/landing-DESIGN.md` "FAQ Accordion Item" spec. Zero new deps, zero hydration cost.
- **Screenshots**: defer real captures to phase 8. Phases 2–7 ship plausible HTML/CSS mockups inside Glow Panels rendered with existing shadcn primitives + the Contribution Heatmap Preview spec.
- **Light theme**: not addressed by this plan. Landing renders correctly under `.dark` (the only theme the app ships in production). Light-theme polish is a follow-up.

## File map (target end state)

```
src/app/
  page.tsx                                       (MODIFIED — render landing for anon)
  (marketing)/                                   (NEW route group, optional — see phase 1)
    layout.tsx                                   (optional, only if extracting nav/footer)

src/components/
  marketing/                                     (NEW)
    marketing-nav.tsx                            (client: mobile sheet)
    marketing-footer.tsx
    hero-section.tsx
    trust-strip.tsx
    why-gitcontrol-section.tsx
    core-capabilities-grid.tsx
    dashboard-tour-section.tsx                   (or split per route)
    architecture-section.tsx
    cache-ttl-table.tsx
    security-privacy-section.tsx
    comparison-table.tsx
    self-hosting-section.tsx
    roadmap-section.tsx
    faq-list.tsx                                 (<details>-based)
    final-cta-banner.tsx
    glow-panel.tsx
    status-badge.tsx
    contribution-heatmap-preview.tsx
    cmd-k-hint.tsx
    github-sign-in-button.tsx                    ("use client")
  icons/
    github-icon.tsx                              (NEW, extracted from login page)

src/app/globals.css                              (MODIFIED — add bg-aurora + bg-code-glow + gradient vars)

src/app/login/page.tsx                           (MODIFIED — swap inline svg import to @/components/icons/github-icon)
```

## Out of scope for this plan

- Real product screenshots (defer to phase 8 polish or follow-up).
- i18n / Spanish copy variant (English only for now).
- Sitemap / robots.txt / Open Graph image (separate SEO pass).
- Removal of `/login` route (kept for backward compat + as a direct sign-in fallback).
- New shadcn primitives beyond Accordion-via-`<details>` decision.
- Light theme tuning beyond what the existing tokens already give us.

## Success criteria (whole plan)

- `pnpm build` passes, zero TypeScript errors.
- `pnpm lint` clean.
- `pnpm dev` → anonymous visit to `http://localhost:3000/` renders the landing.
- Authenticated visit to `/` still redirects to `/dashboard`.
- 3 sign-in CTAs all invoke `signIn.social({provider:"github", callbackURL:"/dashboard"})`.
- Every feature on the landing maps to a real route in `src/app/(dashboard)/*`.
- All design tokens consumed via Tailwind utilities; zero hardcoded OKLCH/hex/px outside `globals.css`.

## Risks

- Accordion via `<details>` breaks if a designer later wants animated height transitions. Mitigation: keep markup minimal; if a follow-up needs motion, swap to Radix Accordion (one Phase, no breaking change).
- Replacing `/` behavior touches the auth boundary. Manual smoke test: log out, hit `/`, see landing; log in, hit `/`, see redirect.
- Long page = many components. Cap each file ≤200 LOC per `development-rules.md`. Phase 4 may need sub-files per dashboard area.
