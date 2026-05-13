import { GitFork, Layers, LayoutGrid, Zap } from "lucide-react";
import {
  FadeInOnView,
  StaggerContainer,
  StaggerItem,
} from "@/components/marketing/motion-primitives";

const BENEFITS = [
  {
    id: "01",
    icon: Zap,
    title: "Cut the context-switching tax.",
    description:
      "Swap personal ↔ org without a page reload. Cmd+K jumps to any repo. Cross-repo Issues and Pulls feeds replace ten browser tabs.",
    metric: "Tab consolidation",
  },
  {
    id: "02",
    icon: GitFork,
    title: "Stay under your rate limit.",
    description:
      "Every Octokit call routes through a per-user Redis envelope with ETag revalidation. A 304 refreshes the TTL — no body refetch, no wasted requests.",
    metric: "ETag revalidation",
  },
  {
    id: "03",
    icon: Layers,
    title: "Track health, not just code.",
    description:
      "Repo health score, sync-status pill, dependency tracker with severity filter, and auto-issue creation for outdated packages — surfaced where you already work.",
    metric: "Health · Deps · Sync",
  },
  {
    id: "04",
    icon: LayoutGrid,
    title: "A layout that's actually yours.",
    description:
      "Pin repos, reorder dashboard cards, pick grid or list view. Every preference persists in Postgres — not localStorage, not vendor settings.",
    metric: "Postgres-backed prefs",
  },
] as const;

// Split-pair grid: 2 columns, each benefit half-width with prominent lime
// numeral, corner tick, hairline dividers separating cards. Replaces the
// older uniform-card grid that visually collided with security-privacy.
export function BenefitsGrid() {
  return (
    <section id="benefits" className="py-24">
      <FadeInOnView className="mb-12 max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Why it&apos;s worth running
        </p>
        <h2 className="mt-3 font-sans text-3xl tracking-tight md:text-4xl">
          Built around the workflows you already do.
        </h2>
      </FadeInOnView>

      <StaggerContainer className="grid grid-cols-1 gap-px bg-border md:grid-cols-2">
        {BENEFITS.map(({ id, icon: Icon, title, description, metric }) => (
          <StaggerItem key={id}>
            <article className="group relative flex h-full flex-col gap-5 bg-background p-8 transition-colors hover:bg-card md:p-10">
              <span
                aria-hidden
                className="pointer-events-none absolute right-4 top-4 size-2 border-r border-t border-primary"
              />
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-3xl text-primary md:text-4xl">
                  {id}
                </span>
                <Icon className="size-5 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="font-sans text-xl tracking-tight md:text-2xl">
                {title}
              </h3>
              <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
              <span className="mt-auto inline-flex w-fit items-center gap-2 border-t border-border pt-4 font-mono text-xs uppercase tracking-wider text-primary">
                <span className="size-1 bg-primary" />
                {metric}
              </span>
            </article>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
