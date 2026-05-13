"use client";

import {
  CircleDot,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Star,
} from "lucide-react";
import { Area, AreaChart, XAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const chartConfig: ChartConfig = {
  count: {
    label: "Contributions",
    color: "var(--color-primary)",
  },
};

const SERIES = [
  { label: "Fri 17", count: 4 },
  { label: "Sat 18", count: 6 },
  { label: "Sun 19", count: 3 },
  { label: "Mon 20", count: 8 },
  { label: "Tue 21", count: 5 },
  { label: "Wed 22", count: 9 },
  { label: "Thu 23", count: 7 },
  { label: "Fri 24", count: 4 },
  { label: "Sat 25", count: 3 },
  { label: "Sun 26", count: 5 },
  { label: "Mon 27", count: 4 },
  { label: "Tue 28", count: 6 },
  { label: "Wed 29", count: 5 },
  { label: "Thu 30", count: 7 },
  { label: "Fri 1", count: 6 },
  { label: "Sat 2", count: 9 },
  { label: "Sun 3", count: 8 },
  { label: "Mon 4", count: 5 },
  { label: "Tue 5", count: 12 },
  { label: "Wed 6", count: 24 },
  { label: "Thu 7", count: 18 },
  { label: "Fri 8", count: 6 },
  { label: "Sat 9", count: 14 },
  { label: "Sun 10", count: 10 },
  { label: "Mon 11", count: 5 },
  { label: "Tue 12", count: 11 },
  { label: "Wed 13", count: 8 },
  { label: "Thu 14", count: 6 },
];

const TOTAL = SERIES.reduce((s, d) => s + d.count, 0);

type Activity = {
  icon: typeof GitCommit;
  title: string;
  age: string;
  tone: "primary" | "muted" | "destructive";
};

const FEED: Activity[] = [
  {
    icon: GitCommit,
    title: "Pushed 3 commits to main",
    age: "8m",
    tone: "primary",
  },
  {
    icon: GitMerge,
    title: "Merged PR #142 — webhook signing",
    age: "1h",
    tone: "primary",
  },
  {
    icon: CircleDot,
    title: "Opened issue — dashboard reorder bug",
    age: "3h",
    tone: "destructive",
  },
  {
    icon: GitPullRequest,
    title: "Opened PR — bump redis to 7.4",
    age: "5h",
    tone: "primary",
  },
  {
    icon: Star,
    title: "Starred vercel/next.js",
    age: "1d",
    tone: "muted",
  },
];

const TONE_CLASS: Record<Activity["tone"], string> = {
  primary: "text-primary",
  muted: "text-muted-foreground",
  destructive: "text-destructive",
};

function tickFormatter(value: string, index: number) {
  return index % 5 === 0 ? value : "";
}

function ContributionsChart() {
  return (
    <ChartContainer
      config={chartConfig}
      className="h-32 w-full **:outline-none! [&_*:focus]:outline-none"
      initialDimension={{ width: 480, height: 128 }}
    >
      <AreaChart
        data={SERIES}
        margin={{ top: 6, right: 4, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="hero-contrib-fill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-primary)"
              stopOpacity={0.45}
            />
            <stop
              offset="100%"
              stopColor="var(--color-primary)"
              stopOpacity={0.02}
            />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{
            fontSize: 10,
            fill: "var(--color-muted-foreground)",
          }}
          tickFormatter={tickFormatter}
          interval={0}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="var(--color-primary)"
          strokeWidth={2}
          fill="url(#hero-contrib-fill)"
          dot={false}
          isAnimationActive
          animationDuration={1200}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function HeroMockup() {
  return (
    <div className="rounded-none bg-card/40 p-3 backdrop-blur-sm">
      <div className="rounded-none border border-border bg-background/80 p-3">
        <div className="mb-2 flex items-end justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Contributions
            </p>
            <p className="mt-0.5 font-sans text-xs text-muted-foreground">
              Last 28 days
            </p>
          </div>
          <div className="text-right">
            <p className="font-sans text-xl font-semibold tabular-nums text-foreground">
              {TOTAL}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-primary">
              +18% vs prev
            </p>
          </div>
        </div>
        <ContributionsChart />
      </div>

      <div className="mt-3 rounded-none border border-border bg-background/80">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Activity
          </p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Recent · cross-repo
          </p>
        </div>
        <ul className="divide-y divide-border">
          {FEED.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.title}
                className="flex items-center gap-3 px-3 py-2"
              >
                <Icon
                  className={cn("size-3.5 shrink-0", TONE_CLASS[item.tone])}
                  strokeWidth={1.75}
                />
                <span className="min-w-0 flex-1 truncate font-sans text-xs text-foreground">
                  {item.title}
                </span>
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                  {item.age}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
