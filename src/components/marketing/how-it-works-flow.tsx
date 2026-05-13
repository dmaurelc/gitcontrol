"use client";

import { useState } from "react";
import {
  ArrowRight,
  Eye,
  LogIn,
  Settings2,
  Plug,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  FadeInOnView,
  StaggerContainer,
  StaggerItem,
} from "@/components/marketing/motion-primitives";

type Step = {
  id: string;
  icon: typeof LogIn;
  label: string;
  short: string;
  detail: string;
};

const STEPS: Step[] = [
  {
    id: "login",
    icon: LogIn,
    label: "Sign in",
    short: "GitHub OAuth",
    detail:
      "One click. GitControl asks for read access to your repos, orgs, packages, and projects. Your token is encrypted on the server the moment the callback completes.",
  },
  {
    id: "connect",
    icon: Plug,
    label: "Connect context",
    short: "Personal or org",
    detail:
      "Pick the active context — your personal account or any organization you belong to. Switch any time from the topbar without reloading the page.",
  },
  {
    id: "manage",
    icon: Settings2,
    label: "Configure",
    short: "Visibility · pins · theme",
    detail:
      "Hide noisy repos, pin the ones you live in, tune the layout, and set your theme. Preferences live in Postgres and follow you across devices.",
  },
  {
    id: "view",
    icon: Eye,
    label: "Track everything",
    short: "Repos · pulls · issues · stars",
    detail:
      "Open the dashboard. See KPIs, contribution heatmap, recent activity, cross-repo PRs and issues, dependency health — every signal in one place.",
  },
];

export function HowItWorksFlow() {
  const [active, setActive] = useState(STEPS[0].id);
  const current = STEPS.find((s) => s.id === active) ?? STEPS[0];
  const reduce = useReducedMotion();

  return (
    <section id="architecture">
      <div className="py-24">
        <FadeInOnView className="mb-16 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            How it works
          </p>
          <h2 className="mt-3 font-sans text-3xl tracking-tight md:text-4xl">
            Four steps from sign-in to insight.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Click any step to learn more.
          </p>
        </FadeInOnView>

        <StaggerContainer className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = step.id === active;
            return (
              <StaggerItem key={step.id}>
                <button
                  type="button"
                  onClick={() => setActive(step.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "group relative flex h-full w-full flex-col gap-5 overflow-hidden rounded-none border p-7 text-left transition-all",
                    isActive
                      ? "border-primary bg-card shadow-lg"
                      : "border-border bg-background hover:-translate-y-1 hover:border-primary/60",
                  )}
                >
                  <div
                    aria-hidden
                    className={cn(
                      "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent transition-opacity",
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60",
                    )}
                  />

                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={cn(
                        "grid size-14 place-items-center rounded-none border transition-colors",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted text-muted-foreground group-hover:border-primary/50 group-hover:text-primary",
                      )}
                    >
                      <Icon className="size-6" strokeWidth={1.5} />
                    </div>
                    <span
                      className={cn(
                        "font-mono text-5xl font-light tracking-tighter transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground/30",
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      Step {i + 1}
                    </p>
                    <p className="mt-2 font-sans text-xl font-medium tracking-tight text-foreground">
                      {step.label}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {step.short}
                    </p>
                  </div>
                </button>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        <div className="mt-8 rounded-none border border-border bg-card p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-4"
            >
              <ArrowRight
                className="mt-1 size-5 shrink-0 text-primary"
                strokeWidth={1.5}
              />
              <div>
                <p className="font-sans text-lg font-medium tracking-tight text-foreground">
                  {current.label}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {current.detail}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
