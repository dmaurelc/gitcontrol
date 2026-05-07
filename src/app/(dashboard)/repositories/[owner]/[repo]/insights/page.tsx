import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Lock } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CommitActivityChart } from "./_components/commit-activity-chart";
import { CodeFrequencyChart } from "./_components/code-frequency-chart";
import { TrafficChart } from "./_components/traffic-chart";

export default async function RepoInsightsPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const { owner, repo } = await params;
  const userId = session.user.id;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Suspense fallback={<ChartSkeleton title="Commit activity" />}>
        <CommitActivitySection userId={userId} owner={owner} repo={repo} />
      </Suspense>
      <Suspense fallback={<ChartSkeleton title="Code frequency" />}>
        <CodeFrequencySection userId={userId} owner={owner} repo={repo} />
      </Suspense>
      <div className="lg:col-span-2">
        <Suspense fallback={<ChartSkeleton title="Traffic (14 days)" />}>
          <TrafficSection userId={userId} owner={owner} repo={repo} />
        </Suspense>
      </div>
    </div>
  );
}

async function CommitActivitySection({
  userId,
  owner,
  repo,
}: {
  userId: string;
  owner: string;
  repo: string;
}) {
  let data: Awaited<ReturnType<typeof githubService.getCommitActivity>>["data"] = null;
  try {
    const res = await githubService.getCommitActivity(userId, owner, repo);
    data = res.data;
  } catch {}

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Commit activity</CardTitle>
        <CardDescription>Weekly commits — last 52 weeks</CardDescription>
      </CardHeader>
      <CardContent>
        {data === null ? (
          <ComputingPlaceholder />
        ) : (
          <CommitActivityChart data={data} />
        )}
      </CardContent>
    </Card>
  );
}

async function CodeFrequencySection({
  userId,
  owner,
  repo,
}: {
  userId: string;
  owner: string;
  repo: string;
}) {
  let data: Awaited<ReturnType<typeof githubService.getCodeFrequency>>["data"] = null;
  try {
    const res = await githubService.getCodeFrequency(userId, owner, repo);
    data = res.data;
  } catch {}

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Code frequency</CardTitle>
        <CardDescription>Additions vs deletions per week</CardDescription>
      </CardHeader>
      <CardContent>
        {data === null ? (
          <ComputingPlaceholder />
        ) : (
          <CodeFrequencyChart data={data} />
        )}
      </CardContent>
    </Card>
  );
}

async function TrafficSection({
  userId,
  owner,
  repo,
}: {
  userId: string;
  owner: string;
  repo: string;
}) {
  let traffic: Awaited<ReturnType<typeof githubService.getRepoTraffic>>["data"] | null = null;
  try {
    const res = await githubService.getRepoTraffic(userId, owner, repo);
    traffic = res.data;
  } catch {}

  const totalViews = traffic?.views?.count ?? 0;
  const uniqueViewers = traffic?.views?.uniques ?? 0;
  const totalClones = traffic?.clones?.count ?? 0;
  const uniqueCloners = traffic?.clones?.uniques ?? 0;

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Traffic</CardTitle>
            <CardDescription>Views and clones — last 14 days</CardDescription>
          </div>
          {traffic && !traffic.restricted ? (
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground tabular-nums">
              <span>
                <strong className="text-foreground">{totalViews.toLocaleString()}</strong>{" "}
                views ({uniqueViewers} unique)
              </span>
              <span>
                <strong className="text-foreground">{totalClones.toLocaleString()}</strong>{" "}
                clones ({uniqueCloners} unique)
              </span>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {!traffic || traffic.restricted ? (
          <RestrictedPlaceholder />
        ) : (
          <TrafficChart views={traffic.views} clones={traffic.clones} />
        )}
      </CardContent>
    </Card>
  );
}

function ComputingPlaceholder() {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
      GitHub is computing stats — refresh in a moment.
    </div>
  );
}

function RestrictedPlaceholder() {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-1 text-center">
      <Lock className="size-5 text-muted-foreground" />
      <p className="text-sm font-medium">Traffic stats are restricted</p>
      <p className="text-xs text-muted-foreground">
        Requires push permission on this repository.
      </p>
    </div>
  );
}

function ChartSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-48 w-full rounded" />
      </CardContent>
    </Card>
  );
}
