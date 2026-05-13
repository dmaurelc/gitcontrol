# Phase 8 — Polish & QA

## Context Links

- All prior phases (1–7)
- [docs/landing-DESIGN.md](../../docs/landing-DESIGN.md) — Do's and Don'ts
- [docs/code-standards.md](../../docs/code-standards.md) — file size, naming, comment rules

## Overview

- **Priority:** P0 (defines "done")
- **Status:** Pending
- **Brief:** Add subtle entrance motion, verify responsive + a11y + build, swap placeholder docs links for real URLs (or anchors), and write the completion report.

## Key Insights

- Motion budget: only the hero gets a single fade+translate entrance. The rest of the page is static. Marketing pages don't need scroll-jacking.
- The biggest risk after a long build is regression on `/login` and `/dashboard`. Test those flows explicitly.
- Lighthouse target: Performance >90, Accessibility ≥95.

## Requirements

### Functional

- Hero left column fades in + translates 8px up on first paint (single client island via `motion` v12).
- All other sections render statically.
- Replace placeholder `/docs/*` hrefs in the footer with the real GitHub blob path or remove them.
- Add `<title>` + `<meta name="description">` for the landing route via Next metadata API.
- Add basic Open Graph + Twitter tags (no image asset yet — meta only).

### Non-functional

- `pnpm build` passes with zero TS errors.
- `pnpm lint` clean (no new warnings).
- Lighthouse desktop: Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥95.
- All sections legible at 360px width.

## Architecture

```
src/components/marketing/
  hero-section.tsx            (modified: extract intro block into hero-intro-motion.tsx client island)
  hero-intro-motion.tsx       (new, "use client", framer-motion fade)

src/app/
  page.tsx                    (modified: export `metadata`)
```

## Related Code Files

### To modify

- `src/app/page.tsx` — add `export const metadata: Metadata = { ... }`.
- `src/components/marketing/hero-section.tsx` — wrap left column intro in `<HeroIntroMotion>` client island.
- `src/components/marketing/marketing-footer.tsx` — finalize docs hrefs.

### To create

- `src/components/marketing/hero-intro-motion.tsx` (`"use client"`).

## Implementation Steps

### 8.1 — Hero entrance motion

`hero-intro-motion.tsx`:
```tsx
"use client";
import { motion } from "motion/react";

export function HeroIntroMotion({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

Wrap the hero left column (eyebrow + headline + subhead + CTAs) in `<HeroIntroMotion>`. The right-column Glow Panel stays static — it's the focal screenshot, and animating it doubles the perceived load time.

### 8.2 — Metadata

In `src/app/page.tsx`:
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GitControl — Self-hosted GitHub dashboard",
  description:
    "Self-hosted, multi-user replacement for github.com's UI. Encrypted OAuth tokens, per-user Redis cache with ETag revalidation, full coverage of repos, issues, pulls, stars, projects, packages.",
  openGraph: {
    title: "GitControl — Self-hosted GitHub dashboard",
    description: "Encrypted tokens. Per-user cache. Your VPS.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GitControl — Self-hosted GitHub dashboard",
    description: "Encrypted tokens. Per-user cache. Your VPS.",
  },
};
```

> Conflict guard: `src/app/layout.tsx` already exports `metadata` with title `"GitControl — GitHub Dashboard"`. Next merges metadata from layout → page, so the page-level title overrides safely. Verify in build output.

### 8.3 — Footer docs links

Replace placeholder hrefs. Two options:
- **Option A (preferred):** Point to public GitHub blob URLs once the repo URL is known. Example: `https://github.com/<owner>/<repo>/blob/main/docs/system-architecture.md`.
- **Option B:** Drop the Docs column from public-facing footer; keep only `#anchor` links inside the page for the local test build.

Document the chosen option in the completion report.

### 8.4 — Responsive QA matrix

Test at these widths in `pnpm dev`:

| Width | Device | What to verify |
|-------|--------|----------------|
| 360px | iPhone SE | Nav hamburger works, hero stacks, code blocks horizontal-scroll without overflowing parent |
| 768px | iPad portrait | Feature grid 2 columns, tour rows still stacked |
| 1024px | iPad landscape / small laptop | Hero two-column, feature grid 3 columns, tour rows alternating |
| 1440px | Desktop | Container max-width respected, no horizontal scroll, Aurora orb stays inside the section |
| 1920px | Large desktop | Whitespace doesn't feel cavernous, content stays centered |

### 8.5 — Accessibility checks

- Keyboard navigation: Tab through nav → hero CTAs → every section → footer. Focus rings visible on every interactive element.
- `aria-label` on the hamburger button, on the cursor blink (`aria-hidden`), on every icon-only button.
- Verify `<details>` keyboard activation (Enter / Space).
- Contrast check: foreground/background AA. The lime `--primary` on `--background` passes for large text; verify any small primary text uses the primary-foreground combo.
- Reduced motion: wrap `HeroIntroMotion` `initial={false}` when `prefers-reduced-motion` is set. Use motion v12's `useReducedMotion()` hook or `MotionConfig reducedMotion="user"`.

### 8.6 — Regression checks

- `/login` still renders + sign-in works.
- `/dashboard` still loads for authed users.
- `/api/health` still returns 200.
- No new entries appear in `pnpm lint` output.

### 8.7 — Completion report

Write `plans/reports/fullstack-260512-1617-landing-page-design.md` with:
- Files added (full list with paths)
- Files modified (full list)
- Final docs-link decision (Option A or B from §8.3)
- Lighthouse scores
- Known issues / follow-ups
- Unresolved questions

## Todo List

- [ ] `hero-intro-motion.tsx` built; hero left column animates in
- [ ] `prefers-reduced-motion` respected
- [ ] Page metadata exported from `src/app/page.tsx`
- [ ] Footer docs links finalized
- [ ] Responsive QA passed at all 5 widths
- [ ] Keyboard navigation verified end-to-end
- [ ] Contrast spot-check on `text-primary` over `bg-card`
- [ ] `pnpm build` + `pnpm lint` clean
- [ ] `/login` + `/dashboard` regression smoke test
- [ ] Lighthouse scores captured
- [ ] Completion report written

## Success Criteria

- Build green.
- Lighthouse: Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥95.
- Hero animates once on load; rest of page static.
- Reduced-motion users see no animation.
- `/login` and `/dashboard` unchanged in behavior.
- Completion report committed.

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Lighthouse Performance drops below 90 due to motion library bundle | `motion/react` tree-shakes well; the hero island is tiny. If still over budget, replace with a CSS `@keyframes` fade — zero JS. |
| Footer placeholder links flagged by Lighthouse SEO | Either finalize hrefs or remove the link entirely. Don't ship `href="#"`. |
| Aurora orb causes paint-rect jank on low-end devices | `blur-3xl` is GPU-accelerated; combined with `opacity-15`–`opacity-20` it's cheap. If paint cost is an issue, swap to a CSS `radial-gradient` rendered into the parent via `background-image`. |

## Security Considerations

- Open Graph URL field intentionally omitted until the production URL is set; avoids leaking a placeholder domain.
- `target="_blank"` external links carry `rel="noreferrer noopener"` already (Phase 7).

## Next Steps

- Merge to `develop` (or whatever branch the user wants) via PR after manual sign-off.
- Capture real screenshots of `/dashboard`, `/repositories`, repo-detail tabs to swap into the Glow Panels in a follow-up.
- Replace `/docs/*` placeholders with public GitHub URLs once the repo origin is decided.
