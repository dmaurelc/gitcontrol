# Design Guidelines

> Visual + interaction conventions for the dashboard. Style baseline is shadcn/ui (new-york) on Tailwind v4.

## 1. Foundations

| Token | Source |
|-------|--------|
| Color system | `components.json` → `baseColor: "neutral"`, CSS variables enabled. Defined in `src/app/globals.css`. |
| Typography | Geist Sans + Geist Mono (loaded in `src/app/layout.tsx` via `next/font/google`). |
| Icons | `lucide-react` exclusively (`components.json: iconLibrary: "lucide"`). |
| Theme | `next-themes` with `attribute="class"`, `defaultTheme="system"`, transitions disabled to avoid FOUC. |

## 2. Layout

- App shell: 240px sidebar + flex column main content (`grid-cols-1 md:grid-cols-[240px_1fr]`). Defined once in `app/(dashboard)/layout.tsx`.
- Topbar: 56px (`h-14`), `OrgSwitcher` left, user avatar dropdown right.
- Page padding: `p-6`. Page-level vertical rhythm: `flex flex-col gap-6` (sections) or `gap-4` (denser pages).
- Card grids: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` for repos/stars/projects/packages.

## 3. Typography Scale

- Page title: `text-2xl font-semibold tracking-tight`.
- Section title: `text-base` (inside `<CardTitle>`).
- Body: default Tailwind `text-sm` for content, `text-xs` for meta.
- Muted secondary text: `text-muted-foreground` token.
- Truncation: long names use `truncate` + `min-w-0` parent. Multi-line clamps use `line-clamp-2` / `line-clamp-3`.

## 4. Components — When to Use What

| Need | Component | Example |
|------|-----------|---------|
| Tabular content | `Card` + `CardContent` | RepoCard, StarsPage |
| Switching views inside a page | `Tabs` (settings page) | settings: Appearance/Account |
| Single-action confirmations | `Dialog` | NewRepoDialog |
| Selecting from list (long) | `Popover` + `Command` | OrgSwitcher |
| Selecting from list (short) | `DropdownMenu` | user avatar menu |
| Async section | `<Suspense fallback={<Skeleton />}>` | dashboard metrics |
| Tag/state | `Badge` | Projects open/closed |
| Boolean prefs | `Checkbox` | new-repo dialog |

Always reach for the existing primitive in `src/components/ui/` first. Add via `pnpm dlx shadcn@latest add <name>` (style: new-york, baseColor: neutral) — never hand-roll.

## 5. Loading States

- Use `<Suspense>` boundaries around RSC sections that fetch from GitHub.
- Skeleton dimensions match real content: `h-24` for metric cards, `h-36` for repo cards, `h-64` for the recent-repos card.
- Never block the entire page on the slowest fetch. Each section has its own boundary (see `app/(dashboard)/dashboard/page.tsx:23-28`).

## 6. Empty States

- Container: `rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground`.
- Copy: explain what's missing and (when relevant) what scope/permission to grant.
  - Example: Packages page surfaces a hint about `read:packages` scope when GitHub returns 403.
  - Example: Projects page hints at `read:project` scope when the list is empty.

## 7. Forms

- Server actions only — no client-side `fetch` to API routes for mutations.
- Use Zod for validation on the server. Surface error messages in the action's return value (`CreateRepoState`).
- Disabled state on submit: combine `useTransition` (or `useFormStatus`) with the button's `disabled` prop.
- Sign-in button uses a `Loader2 animate-spin` icon while pending (`app/login/page.tsx:39-43`).

## 8. Accessibility

- Avatar fallback (`AvatarFallback`) with user initials when no image.
- Sign-in icon has `aria-hidden="true"` (decorative).
- All `Link`s wrapped around `Button` use `asChild`.
- `<DropdownMenu>` and `<Popover>` Radix primitives provide focus management out of the box — don't replace with custom click-outside handlers.

## 9. Iconography

- Stick to Lucide. Common icons used: `LayoutDashboard`, `GitBranch`, `Star`, `KanbanSquare`, `Package`, `Settings`, `GitPullRequest`, `CircleAlert`, `Building2`, `User`, `Loader2`, `ExternalLink`, `Check`, `ChevronsUpDown`.
- Sizes: `size-4` for inline icons, `size-3` for inline meta (counts), `size-8` for avatars.

## 10. Color Usage

- Never hardcode color hexes in components. Use semantic tokens: `bg-background`, `text-foreground`, `text-muted-foreground`, `border`, `bg-sidebar`, `bg-sidebar-accent`, etc.
- Active nav state: `bg-sidebar-accent text-sidebar-accent-foreground`. Idle: `text-sidebar-foreground hover:bg-sidebar-accent/60`.
- Destructive actions (revoke access): use `Button variant="destructive"` (provided by shadcn/ui).

## 11. Responsiveness

- Sidebar hidden below `md` (`md:flex` on `aside`). Mobile pattern (post-MVP phase 4): hamburger trigger + sheet.
- Card grids collapse 3 → 2 → 1 columns at `xl`/`md`.
- Topbar always visible.

## 12. Things to Avoid

- Mixing icon libraries.
- Inline style attributes (use Tailwind classes).
- `useEffect` for data fetching when an RSC + Suspense fits.
- Custom skeleton shapes — `Skeleton` with appropriate `h-*`/`rounded-*` is enough.
- New top-level dependencies for a pattern shadcn/ui already covers.

## 13. Open Design Debt (Tracked in Post-MVP Phase 4)

- Sidebar density / mobile sheet.
- Card hierarchy (currently flat — needs better grouping for pinned vs all repos).
- Typography pairing review.
- Empty-state illustrations (currently text-only).
