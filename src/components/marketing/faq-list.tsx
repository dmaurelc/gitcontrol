import { Plus } from "lucide-react";
import { FadeInOnView } from "@/components/marketing/motion-primitives";

const FAQS = [
  {
    q: "What does GitControl actually do?",
    a: "It replaces github.com's UI for tracking and following the work happening across your repos and orgs — issues, pulls, stars, packages, projects, actions, dependencies. Read-mostly. No code execution, no deploys.",
  },
  {
    q: "Is my GitHub data safe?",
    a: "Your access token is AES-256-GCM encrypted at rest the moment OAuth completes. Cache keys are namespaced per user, so multi-user instances stay isolated. The encryption key never leaves your server.",
  },
  {
    q: "Can multiple users share one instance?",
    a: "Yes. Each user has isolated cache keys, sessions, and preferences. Cross-user leakage is impossible by namespace construction.",
  },
  {
    q: "How does it stay fast under GitHub's rate limit?",
    a: "Every Octokit call is cached in Redis with ETag revalidation. A 304 from GitHub refreshes the TTL without re-fetching the body. Typical sessions hit >70% cache hit rate.",
  },
  {
    q: "Can I write code or push from GitControl?",
    a: "Mostly no — it's a viewing and triage tool. You can create new repos, file issues, and merge PRs through the GitHub API, but the dashboard is not a Git client and never touches your local filesystem.",
  },
];

export function FaqList() {
  return (
    <section id="faq">
      <div className="py-24">
        <FadeInOnView className="mb-12 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            FAQ
          </p>
          <h2 className="mt-3 font-sans text-3xl tracking-tight md:text-4xl">
            Quick answers.
          </h2>
        </FadeInOnView>
        <FadeInOnView className="rounded-none border border-border bg-background" delay={0.1}>
          {FAQS.map(({ q, a }) => (
            <details
              key={q}
              className="group border-b border-border last:border-b-0 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 font-sans text-base font-medium tracking-tight text-foreground transition-colors hover:bg-muted/40">
                <span>{q}</span>
                <Plus
                  className="size-4 shrink-0 text-muted-foreground transition-all group-open:rotate-45 group-open:text-primary"
                  strokeWidth={1.75}
                />
              </summary>
              <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                {a}
              </div>
            </details>
          ))}
        </FadeInOnView>
      </div>
    </section>
  );
}
