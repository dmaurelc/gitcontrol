# Phase 4 — Dashboard Tour

## Context Links

- [docs/codebase-summary.md](../../docs/codebase-summary.md) §Routing Map — full route inventory
- [docs/landing-DESIGN.md](../../docs/landing-DESIGN.md) — Sync Status Pill, Devicon Stack Preview, Repo Health Badge specs
- [docs/project-overview-pdr.md](../../docs/project-overview-pdr.md) §4 Functional Requirements table

## Overview

- **Priority:** P0 (this IS the product documentation the user asked for)
- **Status:** Pending
- **Brief:** A single anchored section `#dashboard-tour` that walks through every dashboard area. Each subsection is an alternating row (image left / image right) with mono eyebrow → heading → description → check-list → Glow Panel mockup.

## Key Insights

- 14 dashboard routes is a lot. Group them into 6 thematic "areas" so the page reads as a tour, not a sitemap.
- Repo Detail tabs deserve their own subsection — that's where the deep functionality lives (8 tabs).
- Use **HTML mockups** (not real screenshots) inside Glow Panels. Each mockup is a small composition of existing shadcn primitives + the spec components from Phase 2 (Contribution Heatmap Preview, Status Badge, Sync Status Pill).
- Section is long; split into one file per area to keep each ≤200 LOC.

## Requirements

### Functional

- One parent `<DashboardTourSection>` anchored at `#dashboard-tour` with a section heading and brief intro.
- Six tour areas rendered in order:
  1. Overview & contribution graph → `/dashboard`
  2. Repositories & filters → `/repositories`
  3. Repo detail (8 tabs) → `/repositories/[owner]/[repo]/*`
  4. Cross-repo inbox → `/issues` + `/pulls` + `/notifications`
  5. Activity, Actions, Stars, Projects, Packages → `/activity` + `/actions` + `/stars` + `/projects` + `/packages`
  6. Settings, Changelog, Report bug → `/settings` + `/changelog` + `/report-bug`
- Each area renders via a reusable `<TourRow>` component: alternating image-left/image-right via `reverse?: boolean` prop.

### Non-functional

- All RSC. Mockups are static markup.
- Each tour file ≤200 LOC.
- Mockups visually distinct (do not reuse the heatmap for every panel).

## Architecture

```
src/components/marketing/
  dashboard-tour-section.tsx              (parent wrapper)
  tour-row.tsx                            (reusable alternating row)
  tour-area-overview.tsx                  (area 1)
  tour-area-repositories.tsx              (area 2)
  tour-area-repo-detail.tsx               (area 3)
  tour-area-inbox.tsx                     (area 4)
  tour-area-discovery.tsx                 (area 5: activity/actions/stars/projects/packages)
  tour-area-platform.tsx                  (area 6: settings/changelog/report-bug)
  mockups/
    overview-mockup.tsx                   (KPI tiles + heatmap)
    repositories-mockup.tsx               (filter chips + repo card list with devicon stack + health badge)
    repo-detail-mockup.tsx                (tabbed shell with 8 tabs)
    inbox-mockup.tsx                      (PR rows with state chips)
    discovery-mockup.tsx                  (split panel: actions runs + projects board)
    platform-mockup.tsx                   (settings appearance panel)
  sync-status-pill.tsx                    (reusable, used in mockups)
  repo-health-badge.tsx                   (reusable, used in mockups)
  devicon-stack-preview.tsx               (reusable)
```

## Related Code Files

### To create

- All files listed in Architecture above.

### To modify

- `src/components/marketing/landing-page.tsx` — render `<DashboardTourSection />` after `<CoreCapabilitiesGrid />`.

## Implementation Steps

### 4.1 — Reusable bits

**`sync-status-pill.tsx`** (RSC):
```tsx
type Props = { fresh: boolean; ageLabel: string };
<span className={cn(
  "inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider rounded-none",
  fresh ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground"
)}>
  <span className={cn("size-1.5 rounded-full", fresh ? "bg-primary-foreground" : "bg-muted-foreground")} />
  {fresh ? "Synced" : "Stale"} · {ageLabel}
</span>
```

**`repo-health-badge.tsx`** (RSC):
```tsx
type Props = { score: number };
const tone =
  score >= 80 ? "bg-primary text-primary-foreground" :
  score >= 50 ? "bg-secondary text-foreground" :
                "bg-destructive text-destructive-foreground";
<span className={cn("inline-flex items-center border border-border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider rounded-none", tone)}>
  Health · {score}
</span>
```

**`devicon-stack-preview.tsx`** (RSC):
Inline flex row of 16px monochrome SVG glyphs (TypeScript "TS", React atom, Node hex, Postgres elephant outline, Redis cube). Stroke 1px in `text-muted-foreground`. Use placeholder Lucide-style line icons if devicon SVGs are not available; the goal is visual texture, not pixel fidelity.

### 4.2 — `tour-row.tsx`

```tsx
type Props = {
  eyebrow: string;                  // "DASHBOARD / OVERVIEW"
  title: string;
  description: React.ReactNode;
  bullets: string[];
  routes: string[];                 // e.g. ["/dashboard"]
  mockup: React.ReactNode;
  reverse?: boolean;
};
<article className={cn(
  "grid items-center gap-12 lg:grid-cols-2",
  reverse && "lg:[&>:first-child]:order-2"
)}>
  <div>
    <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{eyebrow}</p>
    <h3 className="mt-3 font-sans text-2xl tracking-tight md:text-3xl">{title}</h3>
    <p className="mt-4 text-muted-foreground">{description}</p>
    <ul className="mt-6 space-y-2">
      {bullets.map(b => <li key={b} className="flex items-start gap-2 text-sm text-foreground"><Check className="size-4 text-primary mt-0.5 shrink-0" />{b}</li>)}
    </ul>
    <div className="mt-6 flex flex-wrap gap-2">
      {routes.map(r => <code key={r} className="border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground rounded-none">{r}</code>)}
    </div>
  </div>
  <GlowPanel>{mockup}</GlowPanel>
</article>
```

### 4.3 — Parent wrapper

```tsx
// dashboard-tour-section.tsx
<section id="dashboard-tour" className="border-y border-border bg-card/30">
  <div className="mx-auto max-w-[96rem] px-4 py-24 md:px-6">
    <div className="mb-16 max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">DASHBOARD TOUR</p>
      <h2 className="mt-3 font-sans text-3xl tracking-tight md:text-4xl">Every section, explained.</h2>
      <p className="mt-4 text-muted-foreground">A walk through every route in the app. Each capability maps to a real module under <code className="font-mono text-foreground">src/app/(dashboard)</code>.</p>
    </div>
    <div className="space-y-24">
      <TourAreaOverview />
      <TourAreaRepositories />
      <TourAreaRepoDetail />
      <TourAreaInbox />
      <TourAreaDiscovery />
      <TourAreaPlatform />
    </div>
  </div>
</section>
```

### 4.4 — Tour areas (content table)

Each area calls `<TourRow>` with the values below. Alternate `reverse` so rows zig-zag.

**Area 1 — `TourAreaOverview`** (no reverse):
- eyebrow: `DASHBOARD / OVERVIEW`
- title: `Your day at a glance.`
- description: KPI cards for the active context plus a 365-day contribution heatmap and a 28-day activity chart. Cards reorderable; layout persists per user.
- bullets:
  - 365-day GitHub contribution heatmap (real `getContributionsHeatmap` aggregation)
  - 28-day activity chart
  - Click-through KPIs into Issues, Pulls, Repositories, Stars
  - Card layout persisted to `user_preferences.layout` (jsonb)
- routes: `["/dashboard"]`
- mockup: `<OverviewMockup />` — 2×2 grid of KPI tiles above `<ContributionHeatmapPreview />`.

**Area 2 — `TourAreaRepositories`** (reverse):
- eyebrow: `REPOSITORIES`
- title: `One list. Every filter you need.`
- description: Full repo list with server-side filters: text search, language, visibility, sort. Pin/unpin repos to a dedicated top section. Grid/list view toggle persisted per user. Create new repos without leaving the app.
- bullets:
  - Cursor-paginated server actions
  - New-repo dialog (name · description · private · auto-init) with Zod validation
  - View-mode toggle persisted in `user_preferences.defaultView`
  - Per-repo devicon stack, repo health score, sync-status pill
- routes: `["/repositories"]`
- mockup: `<RepositoriesMockup />` — header row with filter chips (`SEARCH`, `LANG`, `VISIBILITY`, `SORT`), then 3 repo card rows each showing repo name, devicon stack, health badge, sync status pill.

**Area 3 — `TourAreaRepoDetail`** (no reverse):
- eyebrow: `REPOSITORY DETAIL`
- title: `Eight tabs per repo. Read-only by design.`
- description: Each repo has dedicated tabs for every workflow. Files, commits, dependencies, and Actions are deep-rendered server-side with the same per-user cache as the dashboard.
- bullets:
  - `overview · issues · pulls · files · commits · insights · actions · dependencies`
  - Aside: releases · tags · contributors
  - Dependencies tab includes Dep Graph + npm-latest with severity filter + auto-issue dialog
  - Insights renders commit activity, code frequency, traffic
- routes: `["/repositories/[owner]/[repo]/*"]`
- mockup: `<RepoDetailMockup />` — 8-tab strip across the top (`overview` active styled with `border-b-2 border-primary`), below that a placeholder rendering area with a fake README block + a small contributors sidebar.

**Area 4 — `TourAreaInbox`** (reverse):
- eyebrow: `CROSS-REPO INBOX`
- title: `Triage every repo from one screen.`
- description: Aggregated views of every issue, pull request, and GitHub notification across the active context. State / label / assignee filters. Mark-all-read on notifications.
- bullets:
  - Cross-repo Issues feed with state + label filters
  - Cross-repo Pulls feed including drafts and merged
  - GitHub notification inbox with mark-all-read action
  - Server-side cache invalidation only on user action
- routes: `["/issues", "/pulls", "/notifications"]`
- mockup: `<InboxMockup />` — list of 5 PR rows each showing repo name (mono), title, status chip (`OPEN` primary, `MERGED` primary subtle, `CLOSED` destructive, `DRAFT` muted), timestamp.

**Area 5 — `TourAreaDiscovery`** (no reverse):
- eyebrow: `DISCOVERY & AUTOMATION`
- title: `Activity, Actions, Stars, Projects, Packages.`
- description: Everything else GitHub exposes — the stuff you usually have to jump tabs to see. All in the same shell.
- bullets:
  - Activity stream (the GitHub events feed) with pagination
  - GitHub Actions runs viewer with filter + pagination
  - Paginated Stars with `starred_at` timestamp
  - Projects v2 listing via GraphQL (`viewer.projectsV2`)
  - Packages by type (container · npm · maven · rubygems · nuget) with scope-error guidance
- routes: `["/activity", "/actions", "/stars", "/projects", "/packages"]`
- mockup: `<DiscoveryMockup />` — side-by-side compact panel: left shows 3 Actions run rows with workflow name + status dot + duration; right shows 4 Project v2 cards in a tiny board layout.

**Area 6 — `TourAreaPlatform`** (reverse):
- eyebrow: `PLATFORM`
- title: `Yours to configure, yours to revoke.`
- description: Settings tab houses appearance and account controls. Changelog auto-publishes from a release workflow. Bug reports file themselves as issues in the project repo.
- bullets:
  - Theme: light · dark · system. Palette locked to lime/zinc, radius 0, IBM Plex Mono
  - Pinned repos management + GitHub access revocation (cascades user delete + wipes cache)
  - Auto-published release notes at /changelog via /api/webhooks/release
  - Built-in bug report form (auto-creates an issue in the project repo)
- routes: `["/settings", "/changelog", "/report-bug"]`
- mockup: `<PlatformMockup />` — Settings panel mock: tab strip (`Appearance` · `Account`), then a theme selector row (3 cards: Light · Dark · System with Dark highlighted), then a "Revoke access" destructive-toned row.

### 4.5 — Wire into landing-page.tsx

Append `<DashboardTourSection />` after `<CoreCapabilitiesGrid />`.

## Todo List

- [ ] Reusable bits built: `sync-status-pill.tsx`, `repo-health-badge.tsx`, `devicon-stack-preview.tsx`
- [ ] `tour-row.tsx` reusable with `reverse` prop
- [ ] 6 mockup files built under `mockups/`
- [ ] 6 tour area files built
- [ ] `dashboard-tour-section.tsx` parent wrapper composed
- [ ] `landing-page.tsx` updated
- [ ] `pnpm build` passes
- [ ] Visual QA: rows alternate correctly, mockups distinct, mobile collapses to single column

## Success Criteria

- 6 distinct tour rows render in order.
- On desktop, rows alternate image-left and image-right.
- On mobile (<1024px), every row collapses to single column with mockup below text.
- Every route mentioned exists in `src/app/(dashboard)/*`.
- All mockups visually distinct — no two areas use the same panel template.
- `#dashboard-tour` anchor reachable from nav.

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Section feels exhausting / too long | Use `space-y-24` between rows + bg-card/30 backdrop for visual separation. Eyebrow + heading per row gives the reader scan landmarks. |
| Mockups balloon LOC | Each mockup file ≤200 LOC; use semantic markup + Tailwind only, no inline JS logic. |
| Real screenshots not yet captured | Phase 8 follow-up. Mockups are intentionally schematic so swapping in real screenshots later is a one-file change per area. |

## Security Considerations

- None. Static content.

## Next Steps

- Phase 5 adds the technical detail sections (architecture, cache TTL table, security).
