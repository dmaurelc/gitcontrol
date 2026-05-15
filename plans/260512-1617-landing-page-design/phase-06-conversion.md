# Phase 6 — Conversion (Comparison · Self-Hosting · Roadmap · FAQ)

## Context Links

- [docs/deployment-guide.md](../../docs/deployment-guide.md) §3 Environment Variables, §1 Prerequisites
- [docs/project-overview-pdr.md](../../docs/project-overview-pdr.md) §7 Out of Scope
- [docs/landing-DESIGN.md](../../docs/landing-DESIGN.md) — Comparison Row Table, Code Block, FAQ Accordion Item specs

## Overview

- **Priority:** P0 (these sections answer the questions that block a visitor from signing in)
- **Status:** Pending
- **Brief:** Four stacked sections: comparison table vs github.com, deploy section with real env vars and CLI snippets, roadmap honesty, FAQ.

## Key Insights

- FAQ uses native `<details>/<summary>` — zero new deps, zero hydration cost. Visual match to DESIGN.md spec achievable via Tailwind alone.
- Self-hosting code blocks must include the real `openssl rand` commands from `deployment-guide.md`. Visitors copy-paste these.
- Roadmap section earns trust by listing what's *missing* honestly. Don't hide gaps.

## Requirements

### Functional

- `<ComparisonTable>` — 12-row table, columns `Capability / GitHub default / GitControl`, anchored at `#comparison`.
- `<SelfHostingSection>` anchored at `#self-hosting` — heading + 3 sub-cards (Dokploy / Docker Compose / Manual Node) + two code blocks (env vars + secret-gen).
- `<RoadmapSection>` — two-column honest grid: out of scope vs shipped.
- `<FaqList>` anchored at `#faq` — 8 `<details>` items styled to match Accordion spec.

### Non-functional

- All RSC. FAQ uses native `<details>` so no client island.
- Code blocks selectable (no pointer-events shenanigans).
- ≤200 LOC per file.

## Architecture

```
src/components/marketing/
  comparison-table.tsx
  self-hosting-section.tsx
  code-block.tsx                   (reusable Code Block spec)
  roadmap-section.tsx
  faq-list.tsx                     (native <details>)
```

## Related Code Files

### To create

- All five files above.

### To modify

- `src/components/marketing/landing-page.tsx` — append `<ComparisonTable />`, `<SelfHostingSection />`, `<RoadmapSection />`, `<FaqList />` in order after `<SecurityPrivacySection />`.

## Implementation Steps

### 6.1 — `code-block.tsx`

```tsx
type Props = {
  language?: string;             // shown as eyebrow
  prefix?: "$" | "#" | null;     // line prefix in primary
  children: string;              // raw code
  className?: string;
};

<div className={cn("relative", className)}>
  {language && (
    <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{language}</p>
  )}
  <pre className="overflow-x-auto border border-border bg-muted px-5 py-4 font-mono text-[13px] leading-relaxed text-foreground rounded-none">
    <code>
      {children.split("\n").map((line, i) => (
        <span key={i} className="block">
          {prefix && <span className="text-primary select-none">{prefix} </span>}
          {line}
        </span>
      ))}
    </code>
  </pre>
</div>
```

### 6.2 — `comparison-table.tsx`

```tsx
const ROWS = [
  ["Dense, opinionated dashboard", false, true],
  ["Multi-org switch without page reload", false, true],
  ["Per-user ETag cache", false, true],
  ["Cross-repo issues view", "partial", true],
  ["Cross-repo PRs view", "partial", true],
  ["365-day contribution heatmap inside the app", "partial", true],
  ["Dependency tracker with severity + auto-issue", false, true],
  ["Cmd+K org/repo index", false, true],
  ["Pinned repos + reorderable dashboard cards", false, true],
  ["Self-hostable on your VPS", false, true],
  ["Encrypted tokens on your server", false, true],
  ["Free of marketing noise", false, true],
] as const;

<section id="comparison" className="mx-auto max-w-[96rem] px-4 py-24 md:px-6">
  <div className="mb-12 max-w-2xl">
    <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">SIDE BY SIDE</p>
    <h2 className="mt-3 font-sans text-3xl tracking-tight md:text-4xl">GitControl vs github.com.</h2>
  </div>
  <div className="border border-border bg-card">
    <div className="grid grid-cols-[1.5fr,1fr,1fr] border-b border-border bg-muted px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
      <span>Capability</span><span className="text-center">GitHub default</span><span className="text-center">GitControl</span>
    </div>
    {ROWS.map(([label, gh, gc]) => (
      <div key={label as string} className="grid grid-cols-[1.5fr,1fr,1fr] items-center border-b border-border px-4 py-3 last:border-b-0 text-sm">
        <span className="text-foreground">{label}</span>
        <span className="flex justify-center"><Cell value={gh} /></span>
        <span className="flex justify-center"><Cell value={gc} /></span>
      </div>
    ))}
  </div>
</section>
```

`Cell` helper:
- `true` → `<Check className="size-5 text-primary" />`
- `false` → `<X className="size-5 text-destructive" />`
- `"partial"` → `<span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">partial</span>`

### 6.3 — `self-hosting-section.tsx`

```tsx
<section id="self-hosting" className="border-y border-border bg-card/30">
  <div className="mx-auto max-w-[96rem] px-4 py-24 md:px-6">
    <div className="mb-12 max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">SELF-HOSTING</p>
      <h2 className="mt-3 font-sans text-3xl tracking-tight md:text-4xl">Deploy in minutes on your hardware.</h2>
      <p className="mt-4 text-muted-foreground">Docker multi-stage build, standalone Next output, ships behind Dokploy. Postgres, Redis, and a GitHub OAuth App is all you need.</p>
    </div>

    <div className="mb-12 grid gap-6 md:grid-cols-3">
      <DeployCard title="Dokploy"
        description="Pre-wired for Dokploy's GitHub provider with /api/health probes. Push to track, rebuild on push."
        recommended />
      <DeployCard title="Docker Compose"
        description="Single docker compose up. Bundled Postgres + Redis. Good for VPS or homelab." />
      <DeployCard title="Manual Node"
        description="Build standalone, run node server.js behind your reverse proxy." />
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h3 className="mb-3 font-sans text-lg tracking-tight">Required environment</h3>
        <CodeBlock language=".env">{`NODE_ENV=production
DATABASE_URL=postgres://user:pass@host:5432/gitcontrol
REDIS_URL=redis://default:pass@host:6379
GITHUB_CLIENT_ID=Iv1...
GITHUB_CLIENT_SECRET=...
TOKEN_ENCRYPTION_KEY=...   # 64-char hex
BETTER_AUTH_SECRET=...     # ≥32 chars
BETTER_AUTH_URL=https://your-domain.com`}</CodeBlock>
      </div>
      <div>
        <h3 className="mb-3 font-sans text-lg tracking-tight">Generate secrets</h3>
        <CodeBlock language="bash" prefix="$">{`openssl rand -hex 32      # TOKEN_ENCRYPTION_KEY
openssl rand -base64 32   # BETTER_AUTH_SECRET`}</CodeBlock>
        <p className="mt-3 text-sm text-muted-foreground">Full instructions in <a className="text-primary hover:underline underline-offset-4" href="https://github.com/...">docs/deployment-guide.md</a>.</p>
      </div>
    </div>
  </div>
</section>
```

`DeployCard`:
```tsx
<article className={cn("border bg-background p-6", recommended ? "border-primary" : "border-border")}>
  {recommended && (
    <p className="mb-3 inline-block border border-primary bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">Recommended</p>
  )}
  <h3 className="font-sans text-lg tracking-tight">{title}</h3>
  <p className="mt-3 text-sm text-muted-foreground">{description}</p>
</article>
```

### 6.4 — `roadmap-section.tsx`

```tsx
const SHIPPED = [
  "Notifications inbox",
  "Activity stream",
  "Actions runs viewer",
  "Cmd+K org/repo index",
  "Dependency tracker (Dep Graph + npm-latest + severity + auto-issue)",
  "365-day contribution heatmap + 28-day activity chart",
  "Commit history with branch/author/date filters",
  "Repo health badge · sync-status pill · devicon stack",
  "View-mode toggle · Changelog page",
];

const OUT_OF_SCOPE = [
  "Issue / PR comment authoring (read-only currently)",
  "GitHub App migration (5k/h → 15k/h rate limit, per-repo scope)",
  "Telemetry / Prometheus metrics",
  "Multi-region deployment",
  "Mobile sheet nav (desktop-first, post-MVP)",
];

<section className="mx-auto max-w-[96rem] px-4 py-24 md:px-6">
  <div className="mb-12 max-w-2xl">
    <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">HONEST STATUS</p>
    <h2 className="mt-3 font-sans text-3xl tracking-tight md:text-4xl">What's shipped, what isn't.</h2>
  </div>
  <div className="grid gap-6 md:grid-cols-2">
    <RoadmapColumn title="Already shipped (post-MVP waves 1–6)" items={SHIPPED} tone="primary" />
    <RoadmapColumn title="Out of scope right now" items={OUT_OF_SCOPE} tone="muted" />
  </div>
</section>
```

`RoadmapColumn`:
```tsx
<article className="border border-border bg-card p-6">
  <h3 className={cn("font-sans text-lg tracking-tight", tone === "primary" && "text-primary")}>{title}</h3>
  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
    {items.map(i => <li key={i} className="flex gap-2"><Dot className="size-4 mt-0.5 shrink-0" />{i}</li>)}
  </ul>
</article>
```
Use a small primary dot for shipped, muted dot for out-of-scope.

### 6.5 — `faq-list.tsx`

```tsx
const FAQS = [
  {
    q: "Is GitControl open source?",
    a: "The code is available for self-hosting. License is private — not a SaaS, not redistributed.",
  },
  {
    q: "Is there a hosted version?",
    a: "No. The whole point is self-hosting. Run it on your own VPS.",
  },
  {
    q: "What do I need to deploy?",
    a: "A VPS with Docker (Dokploy recommended), Postgres 16, Redis 7, a GitHub OAuth App, a 32-byte hex TOKEN_ENCRYPTION_KEY, and a BETTER_AUTH_SECRET. See docs/deployment-guide.md for the exact sequence.",
  },
  {
    q: "How is my GitHub token stored?",
    a: "AES-256-GCM at rest. A Better Auth databaseHooks.account.create.after hook re-encrypts the token immediately after the OAuth callback and clears the plaintext column. The encryption key never leaves your server.",
  },
  {
    q: "Which OAuth scopes does GitControl request?",
    a: "read:user, user:email, repo, read:org, read:packages, read:project. Read-only outside the new-repo creator.",
  },
  {
    q: "Can I use multiple GitHub accounts?",
    a: "One GitHub identity per user, but each user can switch between their personal account and any organization they belong to without reloading.",
  },
  {
    q: "What's the rate-limit story?",
    a: "Octokit calls are cached in Redis with ETag revalidation. A typical session targets >70% cache hit rate. The OAuth App limit is 5k/h per user; GitHub App migration to 15k/h is on the roadmap.",
  },
  {
    q: "How do I update?",
    a: "Push to the tracked branch. Dokploy rebuilds the image and restarts the container. Drizzle migrations run automatically on startup and are idempotent. Release notes auto-publish to /changelog via the release webhook.",
  },
];

<section id="faq" className="border-y border-border bg-card/30">
  <div className="mx-auto max-w-[96rem] px-4 py-24 md:px-6">
    <div className="mb-12 max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">FAQ</p>
      <h2 className="mt-3 font-sans text-3xl tracking-tight md:text-4xl">Common questions.</h2>
    </div>
    <div className="border border-border bg-background">
      {FAQS.map(({ q, a }) => (
        <details key={q} className="group border-b border-border last:border-b-0">
          <summary className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 font-sans text-base font-medium tracking-tight text-foreground transition-colors hover:bg-muted/40">
            <span>{q}</span>
            <Plus className="size-4 shrink-0 text-muted-foreground transition-all group-open:rotate-45 group-open:text-primary" />
          </summary>
          <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{a}</div>
        </details>
      ))}
    </div>
  </div>
</section>
```

Native `<details>` supports keyboard interaction and screen readers without extra ARIA work. `group-open:` Tailwind variant rotates the Plus into an X-like minus.

### 6.6 — Wire into landing-page.tsx

Append the four sections in order: ComparisonTable → SelfHostingSection → RoadmapSection → FaqList.

## Todo List

- [ ] `code-block.tsx` reusable
- [ ] `comparison-table.tsx` with all 12 rows including `partial` cells
- [ ] `self-hosting-section.tsx` with 3 DeployCards + 2 CodeBlocks
- [ ] `roadmap-section.tsx` with shipped vs out-of-scope columns
- [ ] `faq-list.tsx` with 8 `<details>` items + plus-to-minus icon transition
- [ ] `landing-page.tsx` updated
- [ ] `pnpm build` passes
- [ ] Manual QA: every `<details>` opens/closes; code blocks scroll horizontally on mobile

## Success Criteria

- Comparison table rows align (3-column grid stays rigid).
- "Recommended" pill renders on the Dokploy DeployCard only.
- Code blocks preserve whitespace and the `$` prefix renders in `text-primary`.
- FAQ items expand on click; Plus icon rotates to X-shape via `group-open:rotate-45`.
- Roadmap section uses `text-primary` tone for shipped column only.

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| `<details>` styling inconsistent across browsers | Tested behavior in Chrome/Safari/Firefox is identical with the `group-open:` variant; the `summary::-webkit-details-marker` default arrow hidden via `[&_summary]:list-none` or default reset (Tailwind preflight already neutralizes most). Verify in QA. |
| Long answer text causes layout shift on expand | Acceptable — that's the expected `<details>` behavior. Scroll position preserved by the browser. |

## Security Considerations

- The deploy guide link should point at the public repo path, not a private filesystem path. Audit href values before commit.

## Next Steps

- Phase 7 closes with final CTA banner and footer.
