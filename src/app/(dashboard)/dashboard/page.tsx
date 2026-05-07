import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  GitBranch,
  Star,
  GitPullRequest,
  CircleAlert,
  ArrowUpRight,
} from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { getActiveContext } from "@/lib/context/active-context";
import { getUserPreferences } from "@/lib/preferences/get-user-preferences";
import { filterVisible } from "@/lib/preferences/visibility-filter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { ActivityFeed } from "@/components/activity-feed";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Overview"
        description="Snapshot of the active context."
      />
      <Suspense fallback={<MetricsSkeleton />}>
        <Metrics
          userId={session.user.id}
          fallbackLogin={session.user.email}
        />
      </Suspense>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<RecentSkeleton />}>
            <RecentRepos userId={session.user.id} />
          </Suspense>
        </div>
        <Card className="h-full shadow-card">
          <CardHeader>
            <div className="space-y-0.5">
              <CardTitle className="text-base">Activity</CardTitle>
              <p className="text-xs text-muted-foreground">
                Recent GitHub events
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ActivitySkeleton />}>
              <ActivityFeed userId={session.user.id} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function Metrics({
  userId,
  fallbackLogin,
}: {
  userId: string;
  fallbackLogin: string;
}) {
  let viewerLogin = fallbackLogin;
  try {
    const v = await githubService.getViewer(userId);
    viewerLogin = v.data.login;
  } catch {
    // ignore
  }
  const ctx = await getActiveContext(userId, viewerLogin);

  let metrics: {
    repos: number;
    stars: number;
    openPRs: number;
    openIssues: number;
  } = { repos: 0, stars: 0, openPRs: 0, openIssues: 0 };
  try {
    const m = await githubService.getOverviewMetrics(userId, ctx);
    metrics = {
      repos: m.data.repos,
      stars: m.data.stars,
      openPRs: m.data.openPRs,
      openIssues: m.data.openIssues,
    };
  } catch {
    // best effort
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      <StatCard
        title="Repositories"
        value={metrics.repos}
        icon={GitBranch}
        accent="chart-1"
        hint="Owned and collaborator"
      />
      <StatCard
        title="Stars given"
        value={metrics.stars}
        icon={Star}
        accent="chart-4"
        hint="Across all repos"
      />
      <StatCard
        title="Open PRs"
        value={metrics.openPRs}
        icon={GitPullRequest}
        accent="chart-2"
        hint="Across the org"
      />
      <StatCard
        title="Open issues"
        value={metrics.openIssues}
        icon={CircleAlert}
        accent="chart-5"
        hint="Needing triage"
      />
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="gap-2 p-5">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-3 w-32 rounded" />
        </Card>
      ))}
    </div>
  );
}

async function RecentRepos({ userId }: { userId: string }) {
  let repos: Array<{
    id: number;
    full_name: string;
    description: string | null;
    language: string | null;
    pushed_at: string;
    stargazers_count: number;
    owner: { login: string };
  }> = [];
  try {
    const res = await githubService.listRepos(userId, {
      sort: "updated",
      perPage: 30,
    });
    repos = res.data;
  } catch {
    // ignore
  }
  const prefs = await getUserPreferences(userId);
  const pinnedSet = new Set(prefs.pinnedRepos);
  repos = filterVisible(repos, prefs, pinnedSet).slice(0, 8);
  return (
    <Card className="h-full shadow-card">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="space-y-0.5">
          <CardTitle className="text-base">Recently updated</CardTitle>
          <p className="text-xs text-muted-foreground">
            Latest activity across visible repos
          </p>
        </div>
        <Link
          href="/repositories"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all <ArrowUpRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col">
        {repos.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No repos to show"
            description="Connect to GitHub or adjust visibility filters."
            className="border-none bg-transparent py-6"
          />
        ) : (
          <ul className="-mx-2 flex flex-col">
            {repos.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/repositories/${r.full_name}`}
                  className="group flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium group-hover:text-foreground">
                      {r.full_name}
                    </p>
                    {r.description ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {r.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground tabular-nums">
                    {r.language ? (
                      <span className="flex items-center gap-1">
                        <span className="size-2 rounded-full bg-chart-1" />
                        {r.language}
                      </span>
                    ) : null}
                    <span className="flex items-center gap-1">
                      <Star className="size-3" />
                      {r.stargazers_count}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <Skeleton className="mt-0.5 size-6 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-5 w-40 rounded" />
        <Skeleton className="mt-2 h-3 w-56 rounded" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-1/2 rounded" />
              <Skeleton className="h-3 w-3/4 rounded" />
            </div>
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
