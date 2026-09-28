import Link from "next/link";
import { Activity, ArrowUpRight, CircleX, Gauge, Timer } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import type { ActionsUsage } from "@/lib/github/actions-billing-usage";
import type { ActionsUsageContext } from "@/lib/github/actions-billing-usage";
import { getActionsActivity } from "@/lib/github/actions-activity-stats";

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function formatPercent(rate: number | null): string {
  if (rate == null) return "—";
  return `${Math.round(rate * 100)}%`;
}

export async function ActionsActivitySection({
  userId,
  ctx,
  usage,
}: {
  userId: string;
  ctx: ActionsUsageContext;
  usage: ActionsUsage;
}) {
  const extraRepos = usage.byRepo.map((r) => r.repo);
  const activity = await getActionsActivity(userId, ctx, {
    year: usage.year,
    month: usage.month,
    extraRepos,
  });

  if (activity.scannedRepos === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No repository activity"
        description="No workflow runs found for the repositories in this context."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle className="text-base">Most active repositories</CardTitle>
            <p className="text-xs text-muted-foreground">
              Workflow runs in {usage.periodLabel} · {activity.scannedRepos}{" "}
              repos scanned
            </p>
          </div>
          <Gauge className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {activity.repos.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              No workflow runs this month.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Repository</th>
                  <th className="pb-2 pr-3 text-right font-medium">Runs</th>
                  <th className="pb-2 pr-3 text-right font-medium">Success</th>
                  <th className="pb-2 text-right font-medium">Avg time</th>
                </tr>
              </thead>
              <tbody>
                {activity.repos.slice(0, 10).map((repo) => (
                  <tr key={repo.repo} className="border-t">
                    <td className="py-2 pr-3">
                      <Link
                        href={`/repositories/${repo.repo}`}
                        className="inline-flex items-center gap-1 font-medium hover:underline"
                      >
                        <span className="truncate">{repo.repo}</span>
                        {repo.truncated ? (
                          <span className="text-[10px] text-muted-foreground">
                            (≥)
                          </span>
                        ) : null}
                      </Link>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {repo.runs}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {formatPercent(repo.successRate)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">
                      {formatDuration(repo.avgDurationSeconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <Timer className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Slowest workflows</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {activity.slowestWorkflows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No completed runs to measure.
              </p>
            ) : (
              activity.slowestWorkflows.slice(0, 6).map((wf) => (
                <div
                  key={wf.key}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{wf.workflow}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {wf.repo}
                    </p>
                  </div>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatDuration(wf.avgDurationSeconds)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <CircleX className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Most failing workflows</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {activity.workflows.filter((w) => w.failures > 0).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No failing runs this month.
              </p>
            ) : (
              activity.workflows
                .filter((w) => w.failures > 0)
                .slice(0, 6)
                .map((wf) => (
                  <div
                    key={wf.key}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{wf.workflow}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {wf.repo}
                      </p>
                    </div>
                    <span className="shrink-0 tabular-nums text-destructive">
                      {wf.failures}/{wf.runs}
                    </span>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle className="text-base">Recent failed runs</CardTitle>
            <p className="text-xs text-muted-foreground">
              Latest failures across scanned repositories
            </p>
          </div>
          <CircleX className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {activity.failedRuns.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              No failed runs this month.
            </p>
          ) : (
            activity.failedRuns.slice(0, 8).map((run, index) => {
              const key = `${run.repo}-${run.htmlUrl || run.id}-${index}`;
              const rowClassName =
                "group flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60";
              const inner = (
                <>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {run.workflow}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        #{run.runNumber}
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {run.repo}
                      {run.title ? ` · ${run.title}` : ""}
                    </p>
                  </div>
                  <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </>
              );
              return run.htmlUrl ? (
                <Link
                  key={key}
                  href={run.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={rowClassName}
                >
                  {inner}
                </Link>
              ) : (
                <div key={key} className={rowClassName}>
                  {inner}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
