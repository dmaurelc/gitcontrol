import { GitFork, Layers, LayoutGrid, Zap } from "lucide-react";
import {
  FadeInOnView,
  StaggerContainer,
  StaggerItem,
} from "@/components/marketing/motion-primitives";

const BENEFITS = [
  {
    icon: Zap,
    title: "Cut the context-switching tax.",
    description:
      "Swap personal ↔ org without a page reload. Cmd+K jumps to any repo. Cross-repo Issues and Pulls feeds replace ten browser tabs.",
  },
  {
    icon: GitFork,
    title: "Stay under your rate limit.",
    description:
      "Every Octokit call routes through a per-user Redis envelope with ETag revalidation. A 304 refreshes the TTL — no body refetch, no wasted requests.",
  },
  {
    icon: Layers,
    title: "Track health, not just code.",
    description:
      "Repo health score, sync-status pill, dependency tracker with severity filter, and auto-issue creation for outdated packages — surfaced where you already work.",
  },
  {
    icon: LayoutGrid,
    title: "A layout that's actually yours.",
    description:
      "Pin repos, reorder dashboard cards, pick grid or list view. Every preference persists in Postgres — not localStorage, not vendor settings.",
  },
];

export function BenefitsGrid() {
  return (
    <section
      id="benefits"
      className="py-24"
    >
      <FadeInOnView className="mb-12 max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Why it&apos;s worth running
        </p>
        <h2 className="mt-3 font-sans text-3xl tracking-tight md:text-4xl">
          Built around the workflows you already do.
        </h2>
      </FadeInOnView>

      <StaggerContainer className="grid gap-4 md:grid-cols-2">
        {BENEFITS.map(({ icon: Icon, title, description }) => (
          <StaggerItem key={title}>
            <article className="group flex h-full flex-col gap-3 rounded-none border border-border bg-card p-6 transition-colors hover:border-primary">
              <Icon className="size-6 text-primary" strokeWidth={1.5} />
              <h3 className="font-sans text-xl font-medium tracking-tight text-foreground">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </article>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
