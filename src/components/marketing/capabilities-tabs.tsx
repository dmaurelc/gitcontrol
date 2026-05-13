"use client";

import { useState } from "react";
import {
  Activity,
  Boxes,
  Check,
  FolderGit2,
  GitPullRequest,
  LayoutDashboard,
  Settings2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { GlowPanel } from "@/components/marketing/glow-panel";
import { FadeInOnView } from "@/components/marketing/motion-primitives";
import { DiscoveryMockup } from "@/components/marketing/mockups/discovery-mockup";
import { InboxMockup } from "@/components/marketing/mockups/inbox-mockup";
import { OverviewMockup } from "@/components/marketing/mockups/overview-mockup";
import { PlatformMockup } from "@/components/marketing/mockups/platform-mockup";
import { RepoDetailMockup } from "@/components/marketing/mockups/repo-detail-mockup";
import { RepositoriesMockup } from "@/components/marketing/mockups/repositories-mockup";

type Tab = {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  routes: string;
  title: string;
  description: string;
  bullets: string[];
  mockup: React.ReactNode;
};

const TABS: Tab[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    routes: "/dashboard",
    title: "Your day at a glance.",
    description:
      "KPIs for the active context, a 365-day contribution heatmap, and a 28-day activity chart. Reorder cards, layout persists per user.",
    bullets: [
      "Repos · Stars · Open PRs · Open issues KPIs",
      "365-day GitHub contribution heatmap",
      "28-day activity chart with deep-linked KPIs",
    ],
    mockup: <OverviewMockup />,
  },
  {
    id: "repos",
    label: "Repositories",
    icon: FolderGit2,
    routes: "/repositories",
    title: "Every repo, every filter.",
    description:
      "Server-side search, language, visibility, sort. Pin favorites to the top. Grid or list view persisted in Postgres.",
    bullets: [
      "Pin/unpin to surface favorites",
      "Devicon stack · health score · sync-status pill",
      "Create new repos without leaving the app",
    ],
    mockup: <RepositoriesMockup />,
  },
  {
    id: "repo-detail",
    label: "Repo detail",
    icon: GitPullRequest,
    routes: "/repositories/[owner]/[repo]/*",
    title: "Eight tabs per repository.",
    description:
      "Files, commits, dependencies, Actions, insights — all server-rendered with the same per-user cache as the dashboard.",
    bullets: [
      "overview · issues · pulls · files · commits · insights · actions · dependencies",
      "Dependencies tab: Dep Graph + npm-latest + severity filter",
      "Aside: releases · tags · contributors",
    ],
    mockup: <RepoDetailMockup />,
  },
  {
    id: "inbox",
    label: "Inbox",
    icon: Activity,
    routes: "/issues · /pulls · /notifications",
    title: "Triage every repo from one screen.",
    description:
      "Aggregated views of every issue, pull request, and notification across the active context. State, label, and assignee filters.",
    bullets: [
      "Cross-repo issues feed",
      "Cross-repo PRs including drafts and merged",
      "Notification inbox with mark-all-read",
    ],
    mockup: <InboxMockup />,
  },
  {
    id: "discovery",
    label: "Discovery",
    icon: Boxes,
    routes: "/activity · /actions · /stars · /projects · /packages",
    title: "Activity, Actions, Stars, Projects, Packages.",
    description:
      "Everything else GitHub exposes — the stuff you usually have to jump tabs to see, in one shell.",
    bullets: [
      "Activity stream · Actions runs · Starred repos",
      "Projects v2 via GraphQL",
      "Packages by type (container · npm · maven · rubygems · nuget)",
    ],
    mockup: <DiscoveryMockup />,
  },
  {
    id: "platform",
    label: "Platform",
    icon: Settings2,
    routes: "/settings · /changelog · /report-bug",
    title: "Yours to configure, yours to revoke.",
    description:
      "Theme, pinned repos, and a one-click GitHub access revocation that cascades a full user delete and wipes the cache.",
    bullets: [
      "Light · Dark · System theme (palette locked)",
      "Revoke access deletes the user + clears Redis namespace",
      "Auto-published changelog from the release webhook",
    ],
    mockup: <PlatformMockup />,
  },
];

export function CapabilitiesTabs() {
  const [active, setActive] = useState(TABS[0].id);
  const current = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <section
      id="features"
      className="py-24"
    >
      <FadeInOnView className="mb-12 max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          What&apos;s inside
        </p>
        <h2 className="mt-3 font-sans text-3xl tracking-tight md:text-4xl">
          One dashboard, every workflow.
        </h2>
        <p className="mt-4 text-muted-foreground">
          Click through the six surface areas that replace github.com for daily ops.
        </p>
      </FadeInOnView>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="relative min-w-0 -mx-6 lg:mx-0">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent lg:hidden"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent lg:hidden"
          />
          <div
            role="tablist"
            aria-orientation="vertical"
            className="flex flex-row gap-1 overflow-x-auto px-6 [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
          >
            {TABS.map((tab) => {
              const isActive = tab.id === active;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(tab.id)}
                  className={cn(
                    "group relative flex shrink-0 items-center gap-3 border-b-2 px-4 py-3 text-left transition-colors lg:border-b-0 lg:border-l-2",
                    isActive
                      ? "border-primary bg-card text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-card/40 hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                    strokeWidth={1.5}
                  />
                  <span className="font-sans text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid min-w-0 gap-8 lg:grid-cols-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col"
            >
              <code className="self-start rounded-none border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground">
                {current.routes}
              </code>
              <h3 className="mt-4 font-sans text-2xl tracking-tight md:text-3xl">
                {current.title}
              </h3>
              <p className="mt-4 text-muted-foreground">
                {current.description}
              </p>
              <ul className="mt-6 space-y-2">
                {current.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      strokeWidth={1.75}
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${current.id}-mockup`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="min-w-0"
            >
              <GlowPanel className="min-w-0 overflow-hidden">
                {current.mockup}
              </GlowPanel>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
