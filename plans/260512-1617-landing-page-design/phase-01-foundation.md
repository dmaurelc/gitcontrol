# Phase 1 — Foundation

## Context Links

- [docs/landing-DESIGN.md](../../docs/landing-DESIGN.md) — Quick Start section, gradient utilities
- [src/app/layout.tsx](../../src/app/layout.tsx) — root fonts (Chakra Petch + IBM Plex Mono)
- [src/app/page.tsx](../../src/app/page.tsx) — current root redirect logic
- [src/app/login/page.tsx](../../src/app/login/page.tsx) — existing sign-in flow + inline GitHub SVG
- [src/lib/auth/auth.ts](../../src/lib/auth/auth.ts) — server-side session lookup
- [src/lib/auth/auth-client.ts](../../src/lib/auth/auth-client.ts) — `signIn` export

## Overview

- **Priority:** P0 (blocks every other phase)
- **Status:** Pending
- **Brief:** Wire routing, scaffold marketing component directory, extract shared GitHub icon, add two gradient utilities, build reusable `GithubSignInButton`. After this phase, the app boots to a blank landing shell with one working sign-in CTA.

## Key Insights

- Root layout already loads both required fonts. No `next/font` changes needed.
- No `src/middleware.ts` exists in this codebase — auth guard is layout-based. Landing at `/` is naturally public; only `(dashboard)/layout.tsx` redirects unauth.
- `signIn.social({provider:"github", callbackURL:"/dashboard"})` is the canonical entry — confirmed at [src/app/login/page.tsx:26-28](../../src/app/login/page.tsx).
- `radix-ui` umbrella + `motion` v12 + `cmdk` already installed. No new deps for this phase.

## Requirements

### Functional

- Anonymous visit to `/` renders the landing shell.
- Authenticated visit to `/` still redirects to `/dashboard`.
- `/login` continues to work unchanged.
- A reusable `<GithubSignInButton>` component triggers GitHub OAuth.
- A shared `<GithubIcon>` SVG is consumed by both the landing button and the existing login page.
- Tailwind utilities `bg-aurora` + `bg-code-glow` available globally.

### Non-functional

- Zero new package dependencies.
- No hardcoded OKLCH/hex inside marketing components.
- File naming: kebab-case for all new TS/TSX files.
- Each new file ≤200 LOC.

## Architecture

```
src/app/page.tsx                          (RSC)
  ├─ const session = await auth.api.getSession(...)
  ├─ if (session) redirect("/dashboard")
  └─ return <LandingPage />                ← imports marketing components

src/components/marketing/                 (new)
  └─ all section components ship here

src/components/icons/github-icon.tsx       (new, extracted)
  └─ exported as <GithubIcon />, consumed by:
      ├─ src/app/login/page.tsx (replace inline svg)
      └─ src/components/marketing/github-sign-in-button.tsx
```

## Related Code Files

### To modify

- [src/app/page.tsx](../../src/app/page.tsx) — replace the `redirect("/login")` branch with `<LandingPage />`.
- [src/app/login/page.tsx](../../src/app/login/page.tsx) — swap inline SVG to `import { GithubIcon } from "@/components/icons/github-icon"`.
- [src/app/globals.css](../../src/app/globals.css) — append `--gradient-aurora`, `--gradient-code-glow` vars + `bg-aurora` / `bg-code-glow` utilities.

### To create

- `src/components/icons/github-icon.tsx`
- `src/components/marketing/github-sign-in-button.tsx` (`"use client"`)
- `src/components/marketing/landing-page.tsx` (server component that composes section stubs from later phases — exports default)

## Implementation Steps

1. **Extract GitHub icon**
   - Create [src/components/icons/github-icon.tsx](../../src/components/icons/github-icon.tsx) containing the SVG path currently inlined at [src/app/login/page.tsx:7-20](../../src/app/login/page.tsx).
   - Export as named `GithubIcon`, accept `React.SVGProps<SVGSVGElement>`, default 24×24, `fill="currentColor"`, `aria-hidden`.

2. **Update login page to consume shared icon**
   - In [src/app/login/page.tsx](../../src/app/login/page.tsx) remove the inline `function GithubIcon`. Import from `@/components/icons/github-icon`.

3. **Add gradient utilities + vars to globals.css**
   - Inside the existing `:root` block and the `.dark` block, add:
     ```css
     --gradient-aurora: linear-gradient(135deg, oklch(0.8974 0.1487 115.6236) 0%, oklch(0.5851 0.0996 193.0165) 60%, oklch(0.1591 0 0) 100%);
     --gradient-code-glow: radial-gradient(50% 50% at 50% 50%, color-mix(in oklch, oklch(0.8974 0.1487 115.6236) 20%, transparent) 0%, transparent 100%);
     ```
   - Append to the `@layer utilities` (create the layer if missing):
     ```css
     .bg-aurora { background-image: var(--gradient-aurora); }
     .bg-code-glow { background-image: var(--gradient-code-glow); }
     ```

4. **Build `GithubSignInButton`**
   - File: [src/components/marketing/github-sign-in-button.tsx](../../src/components/marketing/github-sign-in-button.tsx).
   - `"use client"`.
   - Props: `variant?: "default" | "outline"`, `size?: "default" | "lg" | "sm"`, `label?: string`, `className?: string`.
   - Use shadcn `<Button>`, `Loader2` spinner during `signIn.social`, `<GithubIcon className="size-4" />` otherwise.
   - Default label: `"Sign in with GitHub"`. Default size: `"lg"`.

5. **Scaffold `<LandingPage>`**
   - File: [src/components/marketing/landing-page.tsx](../../src/components/marketing/landing-page.tsx).
   - Server component (no `"use client"`).
   - For now: returns `<main className="min-h-svh bg-background text-foreground">{/* sections injected in later phases */}</main>` with placeholder `<section>` blocks (one per upcoming phase) that render their section name as a Heading. This lets us verify routing without blocking on real content.

6. **Wire root route**
   - In [src/app/page.tsx](../../src/app/page.tsx):
     ```tsx
     import { redirect } from "next/navigation";
     import { headers } from "next/headers";
     import { auth } from "@/lib/auth/auth";
     import LandingPage from "@/components/marketing/landing-page";

     export default async function Home() {
       const session = await auth.api.getSession({ headers: await headers() });
       if (session) redirect("/dashboard");
       return <LandingPage />;
     }
     ```

7. **Compile + smoke test**
   - `pnpm build` must pass.
   - `pnpm dev` → anonymous visit `/` renders placeholders; sign-in CTA inside the placeholder block initiates OAuth.
   - Visit `/login` to confirm icon still renders.
   - Sign in, then visit `/` again — confirm redirect to `/dashboard`.

## Todo List

- [ ] Create `src/components/icons/github-icon.tsx`
- [ ] Update `src/app/login/page.tsx` to import shared icon
- [ ] Add gradient vars + utilities to `src/app/globals.css`
- [ ] Create `src/components/marketing/github-sign-in-button.tsx`
- [ ] Create `src/components/marketing/landing-page.tsx` (stub)
- [ ] Modify `src/app/page.tsx` to render landing for anonymous
- [ ] Run `pnpm build` → expect success
- [ ] Manual smoke test (anon → landing, authed → /dashboard, /login unchanged)

## Success Criteria

- `pnpm build` passes.
- `/` renders the landing stub for anonymous users.
- `/` redirects authed users to `/dashboard`.
- `/login` still renders with the shared icon (visual parity).
- Sign-in CTA in the stub triggers GitHub OAuth and lands on `/dashboard` after consent.
- `bg-aurora` and `bg-code-glow` applied to a test div produce the documented gradients.

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Extracting the SVG breaks the login page visual | Run login flow manually after the swap; SVG attributes are copied verbatim. |
| `globals.css` edits break the existing theme | Append-only changes inside existing `:root` / `.dark` blocks; gradient vars do not override any existing token. |
| Authed users see a flash of landing before redirect | `redirect()` is server-side in the RSC — no client flash. |

## Security Considerations

- `GithubSignInButton` calls `signIn.social`, which is the existing audited OAuth path. No new credential surface.
- Landing route is public by design. No PII rendered.

## Next Steps

- Phase 2 consumes `<GithubSignInButton>` inside the hero and nav.
- Phase 8 final QA depends on the routing decision made here.
