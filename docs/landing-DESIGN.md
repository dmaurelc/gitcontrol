# GitControl — Landing Style Reference
> Self-hosted developer console, lifted directly from the live app theme

**Theme:** dark-first (matches dashboard), with optional light surface inversions for content sections

The landing mirrors the GitControl dashboard exactly: flat, edge-sharp surfaces with **zero border-radius**, a single high-energy yellow-lime accent (`oklch(0.8974 0.1487 115.6236)`), and a typography pair of **Chakra Petch** (geometric techno sans) plus **IBM Plex Mono** (code, paths, badges). Every color is taken from `src/app/globals.css` so the marketing page reads as a natural extension of the product, not a separate brand. Letter-spacing is tracked wide (`0.024em`) across the page for that engineered, monitor-readable feel. Shadows are reserved and shallow; depth comes from hairline borders and surface tone shifts.

## Tokens — Colors

All values are **OKLCH**, copied verbatim from `src/app/globals.css`. Use them via the Tailwind theme vars (`bg-background`, `text-foreground`, `border-border`, etc.) — do **not** hardcode hex on the landing.

### Dark theme (primary surface for landing)

| Name | Value | Token | Role |
|------|-------|-------|------|
| Background | `oklch(0.1591 0 0)` | `--background` | Page canvas, hero section, full-bleed bands |
| Foreground | `oklch(0.9674 0.0013 286.3752)` | `--foreground` | Default body text |
| Card | `oklch(0.2002 0 0)` | `--card` | Feature cards, comparison rows, deep-dive panels |
| Card Foreground | `oklch(0.9851 0 0)` | `--card-foreground` | Text on cards |
| Popover | `oklch(0.1591 0 0)` | `--popover` | FAQ accordion content surface |
| Primary | `oklch(0.8974 0.1487 115.6236)` | `--primary` | Yellow-lime accent: CTAs, badges, active links, status dots |
| Primary Foreground | `oklch(0.2069 0.0098 285.5081)` | `--primary-foreground` | Text on primary fills (near-black) |
| Secondary | `oklch(0.3092 0 0)` | `--secondary` | Ghost button background, alt chip |
| Secondary Foreground | `oklch(0.9851 0 0)` | `--secondary-foreground` | Text on secondary surfaces |
| Muted | `oklch(0.2178 0 0)` | `--muted` | Inset wells, code block background, alt-row banding |
| Muted Foreground | `oklch(0.7118 0.0129 286.0665)` | `--muted-foreground` | Helper text, captions, footer links |
| Accent | `oklch(0.2488 0.0015 17.2584)` | `--accent` | Hover surface, focused row, decorative tint |
| Accent Foreground | `oklch(0.9851 0 0)` | `--accent-foreground` | Text on accent surfaces |
| Destructive | `oklch(0.3958 0.1331 25.723)` | `--destructive` | Closed issues, X icons in comparison, error chips |
| Destructive Foreground | `oklch(0.9851 0 0)` | `--destructive-foreground` | Text on destructive surfaces |
| Border | `oklch(0.2739 0.0055 286.0326)` | `--border` | All hairline borders, dividers, table rules |
| Input | `oklch(0.2488 0.0015 17.2584)` | `--input` | Input/field backgrounds |
| Ring | `oklch(0.8974 0.1487 115.6236)` | `--ring` | Focus rings (yellow-lime, same as primary) |
| Sidebar | `oklch(0.1591 0 0)` | `--sidebar` | Sticky nav background reference |
| Sidebar Border | `oklch(0.2739 0.0055 286.0326)` | `--sidebar-border` | Nav bottom border |

### Light theme (only if landing offers a toggle — optional)

| Name | Value | Token |
|------|-------|-------|
| Background | `oklch(1 0 0)` | `--background` |
| Foreground | `oklch(0.2069 0.0098 285.5081)` | `--foreground` |
| Card | `oklch(0.967 0.003 264.542)` | `--card` |
| Primary | `oklch(0.8974 0.1487 115.6236)` | `--primary` |
| Border | `oklch(0.9197 0.004 286.3202)` | `--border` |
| Muted | `oklch(0.9674 0.0013 286.3752)` | `--muted` |
| Muted Foreground | `oklch(0.5517 0.0138 285.9385)` | `--muted-foreground` |

### Chart / data palette (yellow-lime → green ramp)

Use these for any data-style decorations on the landing (trust strip dots, comparison row icons, feature stat counters). Source: `--chart-1` … `--chart-5` in `globals.css`.

| Name | Dark value | Light value | Token |
|------|-----------|-------------|-------|
| Chart 1 (Lime Primary) | `oklch(0.8974 0.1487 115.6236)` | `oklch(0.8974 0.1487 115.6236)` | `--chart-1` |
| Chart 2 (Teal Lime) | `oklch(0.6858 0.1175 167.2538)` | `oklch(0.6879 0.1363 125.268)` | `--chart-2` |
| Chart 3 (Teal) | `oklch(0.5851 0.0996 193.0165)` | `oklch(0.6692 0.1517 135.3822)` | `--chart-3` |
| Chart 4 (Steel Blue) | `oklch(0.4864 0.0754 214.9921)` | `oklch(0.779 0.1643 145.1458)` | `--chart-4` |
| Chart 5 (Deep Blue) | `oklch(0.3883 0.041 237.3246)` | `oklch(0.7411 0.1604 155.0073)` | `--chart-5` |

### Optional landing-only decorative gradients

Only for hero atmospheric backdrop and code-mockup halos. Do **not** introduce new solid colors beyond the table above.

```css
--gradient-aurora: linear-gradient(135deg,
  oklch(0.8974 0.1487 115.6236) 0%,
  oklch(0.5851 0.0996 193.0165) 60%,
  oklch(0.1591 0 0) 100%);

--gradient-code-glow: radial-gradient(50% 50% at 50% 50%,
  color-mix(in oklch, oklch(0.8974 0.1487 115.6236) 20%, transparent) 0%,
  transparent 100%);
```

## Tokens — Typography

### Chakra Petch — Display, headings, UI · `--font-chakra-petch`
- **Loaded via:** `next/font/google` in `src/app/layout.tsx` (already wired)
- **CSS variable:** `--font-chakra-petch` (consumed by `--font-sans` in `globals.css`)
- **Stack:** `Chakra Petch, ui-sans-serif, sans-serif, system-ui`
- **Weights loaded:** 300, 400, 500, 600, 700
- **Sizes used on landing:** 14px, 15px, 16px, 18px, 24px, 32px, 40px, 56px, 72px
- **Letter spacing:** all text inherits `--tracking-normal: 0.024em`; tighten display to `-0.025em` via `tracking-tight`
- **Tailwind utility:** `font-sans`
- **Role:** Primary face for hero, section titles, navigation, CTAs, feature card titles, footer headings.

### IBM Plex Mono — Code, paths, badges, eyebrows · `--font-ibm-plex-mono`
- **Loaded via:** `next/font/google` in `src/app/layout.tsx` (already wired)
- **CSS variable:** `--font-ibm-plex-mono` (consumed by `--font-mono` in `globals.css`)
- **Stack:** `IBM Plex Mono, ui-monospace, monospace`
- **Weights loaded:** 300, 400, 500, 600, 700
- **Sizes used on landing:** 11px, 12px, 13px, 14px, 16px
- **Letter spacing:** `0.04em` for uppercase eyebrows, `0` for code blocks
- **Tailwind utility:** `font-mono`
- **Role:** Status badges, eyebrow labels, CLI snippets, env vars, repo paths, version tags, comparison table headers.

### Georgia — Serif (reserved, optional) · `--font-serif`
Available in the system but **not used on the landing**. Mention only.

### Type Scale (landing)

| Role | Size | Line Height | Letter Spacing | Tailwind utility |
|------|------|-------------|----------------|------------------|
| micro / eyebrow | 12px | 1.4 | 0.04em (uppercase) | `text-xs tracking-wider uppercase` |
| caption | 14px | 1.5 | normal (0.024em inherited) | `text-sm` |
| body | 16px | 1.6 | normal | `text-base` |
| body-lg | 18px | 1.6 | normal | `text-lg` |
| subheading | 20px | 1.4 | normal | `text-xl` |
| heading-sm | 24px | 1.3 | tight (-0.001em) | `text-2xl tracking-tight` |
| heading | 32px | 1.2 | tight | `text-3xl tracking-tight` |
| heading-lg | 40px | 1.15 | tight | `text-4xl tracking-tight` |
| display | 56px | 1.05 | tighter | `text-5xl tracking-tighter` |
| display-xl | 72px | 1.0 | tighter | `text-7xl tracking-tighter` |

## Tokens — Spacing & Shapes

**Base unit:** `--spacing: 0.24rem` (≈ 3.84px). Tailwind v4 `p-4` = `4 * 0.24rem ≈ 15.4px`. Stay on this scale.

**Density:** compact-comfortable. Cards breathe but the grid feels engineered.

### Spacing Scale (Tailwind units, real px ≈ unit × 3.84)

| Tailwind | ≈ px | Used for |
|----------|------|----------|
| `1` | 4 | icon offsets |
| `2` | 8 | element gap inside cards |
| `3` | 12 | tight stacks |
| `4` | 15 | default card padding tight |
| `6` | 23 | card padding standard |
| `8` | 31 | card padding generous |
| `10` | 38 | section sub-gap |
| `16` | 61 | section gap (mobile) |
| `24` | 92 | section gap (desktop) |
| `32` | 123 | hero vertical breathing |

### Border Radius (CRITICAL)

`--radius: 0rem`. The entire system is **flat-edged**. The landing follows the same rule:

| Element | Value | Note |
|---------|-------|------|
| chip / badge | `0` | sharp pill replaced by sharp rectangle |
| button | `0` | flat-edge CTAs |
| input | `0` | flat-edge fields |
| card | `0` | sharp cards |
| panel | `0` | sharp panels |
| screenshot frame | `0` | sharp frame |

The **only** exception allowed: 9999px on small circular status dots (e.g. `h-2 w-2 rounded-full bg-primary`), because a dot must be round to read as a dot.

### Layout

- **Container max-width:** 96rem (`--container-8xl`) — already defined in theme, reuse for marketing shell
- **Section gap:** 92px desktop (`py-24`), 61px mobile (`py-16`)
- **Card padding:** 23px (`p-6`) standard, 31px (`p-8`) for hero panels
- **Element gap:** 8–12px (`gap-2` to `gap-3`)
- **Grid gutter:** 23px (`gap-6`)

### Shadows (intentionally subtle)

Use the existing `--shadow-*` tokens. No custom shadows for the landing.

| Token | Use |
|-------|-----|
| `--shadow-xs` | Resting feature card (barely visible) |
| `--shadow-sm` | Card hover lift |
| `--shadow-md` | Hero glow panel |
| `--shadow-lg` | Final CTA banner |

## Components

> Every component below should be built with `shadcn/ui` primitives already present in the app (Button, Card, Badge, Accordion, etc.) using existing theme variables. No new variants.

### Primary CTA Button
**Role:** "Deploy now", "Read the docs"
`<Button>` default variant. Background `--primary`, text `--primary-foreground`, radius `0`, padding `px-5 py-2.5`, font Chakra Petch 500 16px. Hover: ring 2px `--ring` offset 2px.

### Secondary Ghost Button
**Role:** "Live demo →", nav links, "View on GitHub"
`<Button variant="outline">`. Background transparent, text `--foreground`, border 1px `--border`, radius `0`. Hover: background `--accent`, border `--primary`.

### Tertiary Text Link
color `--muted-foreground`, underline-offset 4px. Hover: color `--primary`, no underline change.

### Status Badge
**Role:** "Self-hosted", "MVP shipped", "v1.0"
`<Badge>` variant. Background `--secondary`, text `--primary`, border 1px `--border`, font IBM Plex Mono 500 12px uppercase, letter-spacing 0.04em, padding `px-2 py-0.5`, radius `0`.

### Feature Card
**Role:** Single capability tile
`<Card>`. Background `--card`, border 1px `--border`, radius `0`, padding `p-6`. Hover: border `--primary`, shadow `--shadow-sm`. Icon 24px Lucide stroked at 1.5px, color `--primary`.

### Glow Panel (hero screenshot frame)
Background `--card`, border 1px `--border`, radius `0`, padding `p-2`. Absolutely-positioned `--gradient-code-glow` behind, with `--gradient-aurora` orb further behind at low opacity. Screenshot inside fills the frame, no rounding.

### Code Block
Background `--muted`, border 1px `--border`, radius `0`, padding `px-5 py-4`. Font IBM Plex Mono 14px, color `--foreground`. Optional `$ ` prefix in `--primary`.

### Nav Bar
Sticky top. Background `color-mix(in oklch, var(--background) 70%, transparent)` with `backdrop-filter: blur(12px)`. Bottom border 1px `--sidebar-border`. Height 64px. Links: Chakra Petch 500 14px, color `--muted-foreground`, hover `--foreground`.

### Footer
Background `--background`, top border 1px `--border`, padding `py-16 px-6`. Column titles: Chakra Petch 600 14px uppercase, color `--foreground`. Links: 14px, color `--muted-foreground`.

### Comparison Row Table
Container: `--card` with 1px `--border`. Rows separated by 1px `--border`. Header cells: IBM Plex Mono 12px uppercase. Check icons in `--primary`, X icons in `--destructive`.

### FAQ Accordion Item
`<Accordion>` from shadcn. Trigger: Chakra Petch 500 18px, color `--foreground`. Border-bottom 1px `--border`. Chevron in `--muted-foreground`, rotates to `--primary` on open. Content color `--muted-foreground`.

### Status Dot
Inline `h-2 w-2 rounded-full bg-primary`. Used in trust strip and online indicators.

### Contribution Heatmap Preview
**Role:** Landing screenshot mockup of the 365-day heatmap (`/dashboard`)
12 columns × 7 rows of 12px squares, 2px gap. Cell fills use 5 levels of `--primary` opacity: 8%, 25%, 45%, 70%, 100%. Background `--card`, 1px `--border` outer frame, sharp corners. Year selector pill above using IBM Plex Mono uppercase.

### Sync Status Pill
**Role:** Visual reference to the in-app cache-freshness indicator
Inline pill (no radius — sharp rect). Fresh = `bg-primary text-primary-foreground`. Stale = `bg-muted text-muted-foreground border border-border`. Mono 11px uppercase. Format: `SYNCED · 4m AGO`.

### Devicon Stack Preview
**Role:** Show language icons row used on repo cards
Inline flex row of 16px square monochrome devicons (TypeScript, React, Node, Postgres, Redis). Stroke 1px in `--muted-foreground`. Used in trust strip + repository deep-dive screenshot.

### Repo Health Badge
**Role:** Reference the health-score pill from `lib/github/health-score.ts`
Inline mono badge. Score ≥80 = `bg-primary text-primary-foreground`. 50–79 = `bg-secondary text-foreground`. <50 = `bg-destructive text-destructive-foreground`. Format: `HEALTH · 92`.

### Cmd+K Trigger
**Role:** Hint at the in-app command palette
Inline `<kbd>` pair: `<kbd class="border border-border bg-muted px-1.5 font-mono text-xs">⌘</kbd> <kbd class="border border-border bg-muted px-1.5 font-mono text-xs">K</kbd>`. Show in nav and hero subhead.

## Do's and Don'ts

### Do
- Reuse the exact OKLCH tokens from `src/app/globals.css` via Tailwind utility classes (`bg-background`, `text-primary`, `border-border`).
- Keep every corner sharp — radius `0` everywhere except round status dots.
- Pair Chakra Petch (display/UI) + IBM Plex Mono (code/eyebrows/badges). Reserve Georgia or skip it.
- Lean on the existing 0.024em tracking — don't fight it with manual letter-spacing overrides except on display sizes where tighter reads better.
- Use the yellow-lime `--primary` sparingly: one CTA per section, on status dots, on key icons, on hover/focus rings.
- Build the page with shadcn/ui primitives already in the codebase (Button, Card, Badge, Accordion, Separator, Tabs).
- Wrap screenshots in a Glow Panel with `--gradient-code-glow` behind for atmospheric depth.
- Use IBM Plex Mono uppercase eyebrows above section headings to reinforce the developer-tool identity.

### Don't
- Don't introduce rounded corners. The product is flat-edged; the landing must match.
- Don't add new color tokens. Pull everything from `globals.css`; only the two listed gradients are landing-only.
- Don't use heavy drop shadows — the existing `--shadow-*` tokens are deliberately soft and that's the look.
- Don't substitute the typography. No system-ui fallback in production; load Chakra Petch + IBM Plex Mono via `next/font/google`.
- Don't ship a light-only landing. Default dark; light is optional and only via the existing `.dark` class toggle.
- Don't use emoji in headings; use Lucide icons stroked at 1.5px sized 20px or 24px.
- Don't wrap the page in a different container width — reuse `--container-8xl` (96rem) for visual continuity with the dashboard.

## Surfaces

| Level | Token | Purpose |
|-------|-------|---------|
| 0 | `--background` (`oklch(0.1591 0 0)`) | Page canvas, hero, full-bleed bands |
| 1 | `--card` (`oklch(0.2002 0 0)`) | Feature cards, deep-dive panels, comparison container |
| 2 | `--muted` (`oklch(0.2178 0 0)`) | Code blocks, inset wells, alt-row banding |
| 3 | `--accent` (`oklch(0.2488 0.0015 17.2584)`) | Hover surface, focused-row highlight |

## Imagery

Product-first imagery only. Use real dashboard screenshots from the GitControl app, framed in a Glow Panel (border `--border`, radius `0`, `--gradient-code-glow` behind). When screenshots aren't available, render plausible dashboard mockups inline using existing shadcn components against `--card` and `--muted` surfaces — repo lists with language dots in `--primary`, PR rows with `--primary` (merged) and `--destructive` (closed) status chips, issue boards with `--muted-foreground` metadata.

Icons: Lucide line-style, stroke 1.5px, sized 20–24px. Active/accented state in `--primary`, neutral in `--muted-foreground`. Decorative elements limited to: an Aurora gradient orb at low opacity behind the hero, an optional faint 24px-spaced dotted grid using `--border` color in transitional sections, and a `▌` cursor blink in `--primary` inside hero terminal mockups.

## Layout

The landing uses the existing `--container-8xl` (96rem) max-width on a `--background` canvas. Sections alternate between `--background` (full-bleed) and `--card` (panel band) to create rhythm without introducing new colors. Hero is single-column mobile, two-column at ≥1024px (left: eyebrow + display headline + subhead + dual CTA + status badge; right: Glow Panel with dashboard screenshot). Feature grid: 3 columns desktop, 2 tablet, 1 mobile. Nav: sticky top with backdrop blur. Footer: 4 columns desktop, single column mobile. Vertical rhythm: 92px between sections, 23px between cards, 12px between text blocks within a card.

## Suggested Page Sections

1. **Sticky Nav** — wordmark "GitControl", links (Features, Comparison, Self-hosting, FAQ, Docs), ghost "View on GitHub", primary "Deploy now"
2. **Hero** — IBM Plex Mono eyebrow `SELF-HOSTED · OPEN SOURCE · MVP SHIPPED`, display-xl headline, subhead, primary + ghost CTA, dashboard screenshot in Glow Panel, Aurora orb backdrop
3. **Trust strip** — `BUILT WITH NEXT.JS 16 · DRIZZLE · POSTGRESQL · BETTER AUTH · DOKPLOY` in mono, separated by `--primary` status dots
4. **Problem / Solution** — two-card split. Left card "GitHub's default UI" with `--destructive` X icons. Right card "GitControl" with `--primary` check icons.
5. **Core features grid** — 6 Feature Cards: Secure auth, Dashboard overview, Repository manager, Issues & PRs per repo, Stars/Projects/Packages, Multi-context switcher
6. **Deep-dive sections** — 4 alternating image-left / image-right rows, each with mono eyebrow + heading-lg title + 2–3 sentence body + bullet list (check icons) + Glow Panel screenshot
7. **Comparison Row** — ~10-row table, columns: Capability / GitHub default / GitControl
8. **Self-hosting** — heading "Deploy in minutes, on your hardware.", Code Block with deploy snippet, three sub-cards (Dokploy, Docker Compose, Manual Node), link to `docs/deployment-guide.md`
9. **Security & privacy** — three columns with Lucide lock/shield icons in `--primary`: Encrypted token storage, OAuth-only, Your infra
10. **FAQ Accordion** — 7 questions covering open source, no SaaS, deploy reqs, token storage, multi-account, unsupported features, updates
11. **Final CTA banner** — full-bleed band on `--card`, Aurora orb backdrop, display headline "Take back your dashboard.", primary "Deploy GitControl" + ghost "Read the docs"
12. **Footer** — 4 columns: Product, Docs, Resources, Legal. Bottom: copyright, version badge, "Made for developers who self-host"

## Agent Prompt Guide

Quick token reference (use Tailwind utility classes — never hardcode OKLCH on landing):

| Purpose | Utility | Source token |
|---------|---------|--------------|
| Page background | `bg-background` | `oklch(0.1591 0 0)` |
| Default text | `text-foreground` | `oklch(0.9674 0.0013 286.3752)` |
| Card surface | `bg-card text-card-foreground` | `oklch(0.2002 0 0)` |
| Muted surface (code blocks) | `bg-muted` | `oklch(0.2178 0 0)` |
| Primary accent | `bg-primary text-primary-foreground` | `oklch(0.8974 0.1487 115.6236)` |
| Border | `border border-border` | `oklch(0.2739 0.0055 286.0326)` |
| Muted text | `text-muted-foreground` | `oklch(0.7118 0.0129 286.0665)` |
| Focus ring | `focus-visible:ring-2 ring-ring` | same as primary |
| Destructive | `text-destructive` / `bg-destructive` | `oklch(0.3958 0.1331 25.723)` |

Example component prompts:

- **Primary CTA**: `<Button className="rounded-none px-5 py-2.5 font-medium">Deploy now</Button>` — relies on default shadcn variant using `bg-primary text-primary-foreground`. Add `focus-visible:ring-2 ring-ring ring-offset-2 ring-offset-background`.
- **Feature card**: `<Card className="rounded-none border-border bg-card p-6 hover:border-primary transition-colors">` with Lucide icon `<GitBranch className="size-6 text-primary" strokeWidth={1.5} />`, title `<h3 className="font-sans text-xl tracking-tight">…</h3>`, body `<p className="text-muted-foreground text-base">…</p>`.
- **Hero headline**: `<h1 className="font-sans text-5xl md:text-7xl tracking-tighter leading-[1.05] text-foreground">Your GitHub. Your server. Your dashboard.</h1>`.
- **Code block**: `<pre className="rounded-none border border-border bg-muted px-5 py-4 font-mono text-sm overflow-x-auto"><code><span className="text-primary">$</span> docker compose up -d</code></pre>`.
- **Status badge**: `<span className="inline-flex items-center gap-2 border border-border bg-secondary px-2 py-0.5 font-mono text-xs uppercase tracking-wider text-primary"><span className="size-2 rounded-full bg-primary" />Self-hosted</span>`.
- **Mono eyebrow**: `<p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Built for developers</p>`.

## Similar Brands

- **Linear** — Sharp dark UI, precise typography, restrained accent palette.
- **Vercel** — Flat geometry, generous black canvases, monochrome-with-one-accent discipline.
- **Supabase** — Green/lime primary on dark, developer-tool tone, code-forward landings.
- **Resend** — Mono typography accents, hairline borders, screenshot-driven sections.
- **Railway / Fly.io** — Self-hosting/infra positioning with utilitarian dark UI.

## Quick Start

### CSS Custom Properties

Already defined in `src/app/globals.css`. The landing should **import nothing new** — it consumes the existing variables. The only optional addition is the two gradients below, placed in `globals.css` or a `marketing.css` module:

```css
/* Landing-only decorative gradients (optional) */
:root,
.dark {
  --gradient-aurora: linear-gradient(135deg,
    oklch(0.8974 0.1487 115.6236) 0%,
    oklch(0.5851 0.0996 193.0165) 60%,
    oklch(0.1591 0 0) 100%);

  --gradient-code-glow: radial-gradient(50% 50% at 50% 50%,
    color-mix(in oklch, oklch(0.8974 0.1487 115.6236) 20%, transparent) 0%,
    transparent 100%);
}

@layer utilities {
  .bg-aurora { background-image: var(--gradient-aurora); }
  .bg-code-glow { background-image: var(--gradient-code-glow); }
}
```

### Tailwind v4 — already wired

The project already uses Tailwind v4 with `@theme inline` mapping every variable above to a utility class. No changes required. Reuse:

- Colors: `bg-{background|card|muted|primary|secondary|accent|destructive}`, `text-{foreground|primary-foreground|muted-foreground|destructive}`, `border-border`, `ring-ring`
- Fonts: `font-sans` (Chakra Petch), `font-mono` (IBM Plex Mono)
- Tracking: `tracking-tight`, `tracking-tighter`, `tracking-normal`, `tracking-wider`
- Container: `max-w-[96rem]` or the existing dashboard shell width
- Shadows: `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg`
- Radius: **omit / use `rounded-none`** — `--radius: 0`

### Fonts (Next.js App Router) — already wired

`src/app/layout.tsx` already imports `Chakra_Petch` and `IBM_Plex_Mono` from `next/font/google` and binds them to `--font-chakra-petch` + `--font-ibm-plex-mono`. `src/app/globals.css` then maps them via `--font-sans` / `--font-mono`. The landing must **reuse the existing root layout fonts** — no new font imports required. Just use `font-sans` and `font-mono` utilities.
