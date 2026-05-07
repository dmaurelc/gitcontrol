# Phase 04 — UI/UX Redesign Report

**Branch:** `feat/phase-04-ui-redesign`
**Commits:**
- `73fa3da` — tokens, shell, shared components, bento dashboard
- `eaf566d` — issue list, repo detail header, pinned section, login
- `293c4c9` — filter bars with search icon and card surface

## Scope delivered

### 1. Tokens (`src/app/globals.css`)
- Bumped `--radius` from `0.625rem` to `0.75rem` (softer, more premium feel).
- Added shadow tokens: `--shadow-soft`, `--shadow-card`, `--shadow-card-hover` (light + dark variants tuned with oklch alpha).
- Exposed via `@theme inline` so Tailwind v4 generates `shadow-soft`, `shadow-card`, `shadow-card-hover` utilities.

### 2. Sidebar v2 (`_components/app-sidebar.tsx`, `_components/mobile-sidebar.tsx`)
- Reorganized into **Workspace** / **GitHub** / **System** sections with subtle uppercase labels.
- Active state pronounced: left accent bar (primary color) + sidebar-accent background pill + `shadow-soft`.
- Logo upgraded to a gradient mark (`bg-linear-to-br from-chart-1 to-chart-4`) + Sparkles icon.
- Sticky 100vh layout, scrollable nav, footer line "v0.1 — self-hosted".
- New `MobileSidebar` uses radix `Dialog` (already imported via `radix-ui`) as a left-slide drawer (no new deps).

### 3. Topbar (`_components/topbar.tsx`)
- Sticky w/ `backdrop-blur` for a layered feel.
- Mobile menu trigger on the left (only visible <md).
- Global search trigger: button with `Search` icon + `⌘K` kbd hint (placeholder, disabled — no command palette logic yet).
- Notifications icon (disabled placeholder).
- Avatar dropdown polished: ring around avatar, full profile preview row inside menu.
- OrgSwitcher visually integrated; appears either next to the search (md+) or near the avatar on mobile.

### 4. Shared components (`src/components/`)
- `page-header.tsx` — title + optional description + optional action slot. Replaces inline header divs.
- `empty-state.tsx` — icon bubble + title + description + optional CTA, dashed bordered card.
- `stat-card.tsx` — accent-tinted icon chip, large tabular value, hint, optional trend, hover lift via `shadow-card-hover`.

### 5. Dashboard (`dashboard/page.tsx`)
- Replaced `MetricCard` with `StatCard` (4 across: chart-1/4/2/5 accents).
- Bento layout: stats row → 2-col area (RecentRepos spans 2/3, Activity placeholder 1/3).
- RecentRepos now a tighter list w/ language color dot + hover row, "View all" affordance.
- Faithful skeletons for stats and recent list (shapes mirror real content).

### 6. Repo card (`repositories/_components/repo-card.tsx`)
- Owner avatar (`https://github.com/<login>.png`) + clearer two-line owner/name hierarchy.
- Language color dot driven by new `lib/github/language-colors.ts` (subset of linguist colors, falls back to neutral).
- Bottom metadata moved below a divider for clearer scanning.
- Hover lift + ring on focus, `shadow-card` baseline.

### 7. Skeleton loaders
- `repositories/page.tsx` — `ListSkeleton` rebuilt to mirror RepoCard (avatar block, title, two-line desc, footer).
- `dashboard/page.tsx` — `MetricsSkeleton` mirrors StatCard, `RecentSkeleton` mirrors the list rows.

### 8. Empty states (replaced inline divs across)
- `repositories/page.tsx` filter empty
- `repositories/_components/issue-list.tsx`
- `repositories/[owner]/[repo]/layout.tsx` repo-not-found
- `stars/page.tsx`
- `projects/page.tsx`
- `packages/page.tsx`

### 9. Mobile pass
- Sidebar collapses to drawer (radix Dialog with slide-in-from-left).
- Topbar elements stack and prioritize search on md+, OrgSwitcher near avatar on mobile.
- Touch targets ≥ 44px (sidebar links min-h-11, mobile menu/avatar buttons size-10).
- Cards stack to single col on small screens, 2col md, 3col xl.

### Bonus polish (out of strict scope but cheap wins)
- Filter bars (`repo-filters.tsx`, `stars-filters.tsx`): card-surface container + search icon inside input.
- Repo detail header: owner avatar tile, breadcrumb hierarchy, side actions.
- Pinned section: small chart-4 accent badge with count.
- Login page: ambient gradient blur background + brand mark + trust footer.
- Issue list: rounded card border, hover row, message-icon for comment count.

## Files touched

```
M  src/app/globals.css
M  src/app/(dashboard)/layout.tsx
M  src/app/(dashboard)/_components/app-sidebar.tsx
A  src/app/(dashboard)/_components/mobile-sidebar.tsx
M  src/app/(dashboard)/_components/topbar.tsx
M  src/app/(dashboard)/_components/org-switcher.tsx
M  src/app/(dashboard)/dashboard/page.tsx
M  src/app/(dashboard)/repositories/page.tsx
M  src/app/(dashboard)/repositories/_components/repo-card.tsx
M  src/app/(dashboard)/repositories/_components/repo-filters.tsx
M  src/app/(dashboard)/repositories/_components/pinned-repos.tsx
M  src/app/(dashboard)/repositories/_components/issue-list.tsx
M  src/app/(dashboard)/repositories/[owner]/[repo]/layout.tsx
M  src/app/(dashboard)/stars/page.tsx
M  src/app/(dashboard)/stars/_components/stars-filters.tsx
M  src/app/(dashboard)/projects/page.tsx
M  src/app/(dashboard)/packages/page.tsx
M  src/app/(dashboard)/settings/page.tsx
M  src/app/login/page.tsx
A  src/components/page-header.tsx
A  src/components/empty-state.tsx
A  src/components/stat-card.tsx
A  src/lib/github/language-colors.ts
```

## Validation
- `pnpm lint` clean.
- `pnpm build` clean — all 11 routes compile, TypeScript ok, static page generation succeeds.
- No new dependencies added. Used only existing radix-ui / shadcn primitives.

## Deferred / not done
- **Command palette** behind ⌘K: only the trigger is rendered; no `cmdk`-driven search modal yet (was explicitly out of scope per phase doc).
- **Sparkline / trend** in StatCard: API exposes `trend` but no real series data yet; trend is rendered if passed but not populated by Dashboard (no historical metrics endpoint).
- **Notifications icon** is a disabled placeholder (no notifications backend).
- **Activity card** on dashboard is an EmptyState placeholder pending an events feed.

## Decisions / safest defaults taken
- Used radix `Dialog` (slide-in-from-left content) for the mobile drawer instead of installing `Sheet`. The phase brief allowed this fallback. No new deps.
- Owner avatars use `https://github.com/<login>.png?size=64` (public unauthenticated endpoint) to avoid round-tripping to GitHub API for every card.
- Language colors are a static subset (~30 most common). YAGNI on full linguist YAML.
- Open badge on Projects page uses emerald, reusing the trend palette for consistency (no new color tokens).
- Tailwind v4 IDE diagnostics suggested a few canonical class swaps (`bg-gradient-to-br` → `bg-linear-to-br`, `shadow-(--shadow-soft)` → `shadow-soft`). Applied these where flagged. Remaining `min-h-[2.5rem]` / `w-[180px]` / `[mask-image:...]` warnings are functionally equivalent and were left as-is.

## Unresolved questions
- Should the global search be wired now or wait for a separate phase? Current trigger is `disabled` + aria-labeled "coming soon".
- Trend deltas: do we want a daily snapshot table to compute 7d/30d trends for StatCard, or skip until needed?
- Activity feed source — events API vs. GraphQL contributionsCollection? (out of UI scope but design slot is reserved).

---

**Status:** DONE
**Summary:** Phase-04 redesign shipped across tokens, sidebar v2, topbar, dashboard bento + StatCards, polished repo cards, faithful skeletons, EmptyState rollout, mobile drawer, and login glow. Three commits on `feat/phase-04-ui-redesign`. Lint + build clean. No new dependencies.
