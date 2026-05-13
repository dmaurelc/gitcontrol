"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { FadeInOnView } from "@/components/marketing/motion-primitives";

const FAQS = [
  {
    category: "Product",
    q: "What does GitControl actually do?",
    a: "It replaces github.com's UI for tracking and following the work happening across your repos and orgs — issues, pulls, stars, packages, projects, actions, dependencies. Read-mostly. No code execution, no deploys.",
  },
  {
    category: "Security",
    q: "Is my GitHub data safe?",
    a: "Your access token is AES-256-GCM encrypted at rest the moment OAuth completes. Cache keys are namespaced per user, so multi-user instances stay isolated. The encryption key never leaves your server.",
  },
  {
    category: "Multi-user",
    q: "Can multiple users share one instance?",
    a: "Yes. Each user has isolated cache keys, sessions, and preferences. Cross-user leakage is impossible by namespace construction.",
  },
  {
    category: "Performance",
    q: "How does it stay fast under GitHub's rate limit?",
    a: "Every Octokit call is cached in Redis with ETag revalidation. A 304 from GitHub refreshes the TTL without re-fetching the body. Typical sessions hit >70% cache hit rate.",
  },
  {
    category: "Product",
    q: "Can I write code or push from GitControl?",
    a: "Mostly no — it's a viewing and triage tool. You can create new repos, file issues, and merge PRs through the GitHub API, but the dashboard is not a Git client and never touches your local filesystem.",
  },
] as const;

type RowProps = {
  id: string;
  number: string;
  question: string;
  answer: string;
  category: string;
  isOpen: boolean;
  onToggle: () => void;
};

function Row({ id, number, question, answer, category, isOpen, onToggle }: RowProps) {
  const panelId = `faq-panel-${id}`;

  return (
    <li className="border-t border-border last:border-b">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className="group grid w-full grid-cols-[60px_1fr_24px] items-start gap-6 py-6 text-left transition-colors md:grid-cols-[80px_1fr_140px_24px]"
      >
        <span className="pt-1 font-mono text-2xl text-primary md:text-3xl">
          {number}
        </span>
        <span className="text-lg tracking-tight transition-colors group-hover:text-foreground md:text-xl">
          {question}
        </span>
        <span className="hidden self-start justify-self-end border border-border bg-card px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:inline-block">
          {category}
        </span>
        <Plus
          className={`mt-1.5 size-4 shrink-0 transition-all ${
            isOpen ? "rotate-45 text-primary" : "text-muted-foreground"
          }`}
          strokeWidth={1.75}
        />
      </button>
      {/* grid-rows trick: animate from 0fr → 1fr for smooth height collapse
         without measuring scrollHeight. Inner wrapper clips overflow during
         the transition. */}
      <div
        id={panelId}
        aria-hidden={!isOpen}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="grid grid-cols-[60px_1fr] gap-6 pb-6 md:grid-cols-[80px_1fr_140px_24px]">
            <span aria-hidden />
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {answer}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}

// FAQ · Numbered Stack accordion: lime numerals, category tag right, single-
// open with smooth grid-rows transition. Entire row is clickable.
export function FaqList() {
  const [openId, setOpenId] = useState<string | null>("01");

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
        <FadeInOnView delay={0.1}>
          <ol className="flex flex-col">
            {FAQS.map((f, i) => {
              const id = String(i + 1).padStart(2, "0");
              return (
                <Row
                  key={f.q}
                  id={id}
                  number={id}
                  question={f.q}
                  answer={f.a}
                  category={f.category}
                  isOpen={openId === id}
                  onToggle={() => setOpenId((cur) => (cur === id ? null : id))}
                />
              );
            })}
          </ol>
        </FadeInOnView>
      </div>
    </section>
  );
}
