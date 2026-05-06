import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GitBranch, Star, GitPullRequest, CircleAlert } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { getActiveContext } from "@/lib/context/active-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Snapshot of the active context.
        </p>
      </div>
      <Suspense fallback={<MetricsSkeleton />}>
        <Metrics userId={session.user.id} fallbackLogin={session.user.email} />
      </Suspense>
      <Suspense fallback={<RecentSkeleton />}>
        <RecentRepos userId={session.user.id} />
      </Suspense>
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
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <MetricCard
        title="Repositories"
        value={metrics.repos}
        Icon={GitBranch}
      />
      <MetricCard title="Stars given" value={metrics.stars} Icon={Star} />
      <MetricCard
        title="Open PRs"
        value={metrics.openPRs}
        Icon={GitPullRequest}
      />
      <MetricCard
        title="Open issues"
        value={metrics.openIssues}
        Icon={CircleAlert}
      />
    </div>
  );
}

function MetricCard({
  title,
  value,
  Icon,
}: {
  title: string;
  value: number;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
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
  }> = [];
  try {
    const res = await githubService.listRepos(userId, {
      sort: "updated",
      perPage: 8,
    });
    repos = res.data;
  } catch {
    // ignore
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recently updated</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {repos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No repos to show.</p>
        ) : (
          repos.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 border-b pb-2 last:border-b-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.full_name}</p>
                {r.description ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {r.description}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {r.language ? <span>{r.language}</span> : null}
                <span className="flex items-center gap-1">
                  <Star className="size-3" />
                  {r.stargazers_count}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function RecentSkeleton() {
  return <Skeleton className="h-64 rounded-xl" />;
}
