import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink, GitBranch, GitCommit } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RunStatusIcon } from "../_components/run-status-icon";
import { JobTree } from "./_components/job-tree";
import { RerunButton } from "../_components/rerun-button";
import type { WorkflowJob, WorkflowRun } from "@/lib/github/service";

function formatDuration(startIso: string, endIso: string): string {
  const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (diffMs <= 0) return "0s";
  const totalSec = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function conclusionLabel(
  status: WorkflowRun["status"],
  conclusion: WorkflowRun["conclusion"],
): string {
  if (status === "in_progress") return "In progress";
  if (status === "queued") return "Queued";
  if (status === "waiting") return "Waiting";
  if (!conclusion) return status ?? "Unknown";
  return conclusion.charAt(0).toUpperCase() + conclusion.slice(1);
}

function conclusionVariant(
  status: WorkflowRun["status"],
  conclusion: WorkflowRun["conclusion"],
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "in_progress" || status === "queued") return "outline";
  if (conclusion === "success") return "default";
  if (conclusion === "failure") return "destructive";
  return "secondary";
}

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string; run_id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { owner, repo, run_id } = await params;
  const runId = parseInt(run_id, 10);

  if (isNaN(runId)) {
    return (
      <EmptyState
        title="Invalid run ID"
        description="The run ID in the URL is not valid."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={`/repositories/${owner}/${repo}/actions`}>
              Back to Actions
            </Link>
          </Button>
        }
      />
    );
  }

  const [runResult, jobsResult] = await Promise.allSettled([
    githubService.getWorkflowRun(session.user.id, owner, repo, runId),
    githubService.listJobsForWorkflowRun(session.user.id, owner, repo, runId),
  ]);

  if (runResult.status === "rejected") {
    return (
      <EmptyState
        title="Run not found"
        description="This workflow run may not exist or you may not have access."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={`/repositories/${owner}/${repo}/actions`}>
              Back to Actions
            </Link>
          </Button>
        }
      />
    );
  }

  const run = runResult.value.data;
  const jobs: WorkflowJob[] =
    jobsResult.status === "fulfilled" ? jobsResult.value : [];

  const duration =
    run.status === "completed"
      ? formatDuration(run.created_at, run.updated_at)
      : null;

  const canReRun =
    run.status !== "in_progress" && run.status !== "queued";

  const commitMsg = run.head_commit?.message?.split("\n")[0] ?? "";
  const shortSha = run.head_sha.slice(0, 7);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <PageHeader
            plain
            title={`${run.display_title || run.name || "Run"} #${run.run_number}`}
            className="min-w-0 flex-1"
          />
          <div className="flex shrink-0 items-center gap-2 mt-1">
            <RerunButton
              owner={owner}
              repo={repo}
              runId={run.id}
              disabled={!canReRun}
            />
            <Button asChild variant="ghost" size="icon">
              <a href={run.html_url} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                <span className="sr-only">Open on GitHub</span>
              </a>
            </Button>
          </div>
        </div>

        {/* Meta row */}
        <Card>
          <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm">
            <div className="flex items-center gap-1.5">
              <RunStatusIcon status={run.status} conclusion={run.conclusion} />
              <Badge
                variant={conclusionVariant(run.status, run.conclusion)}
                className="text-xs"
              >
                {conclusionLabel(run.status, run.conclusion)}
              </Badge>
            </div>

            {run.head_branch && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <GitBranch className="size-3.5" />
                <span>{run.head_branch}</span>
              </span>
            )}

            {commitMsg && (
              <span className="flex items-center gap-1 text-muted-foreground min-w-0">
                <GitCommit className="size-3.5 shrink-0" />
                <span className="truncate max-w-[300px]">{commitMsg}</span>
                <span className="font-mono text-[11px] shrink-0">{shortSha}</span>
              </span>
            )}

            {run.actor && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Avatar className="size-5">
                  <AvatarImage src={run.actor.avatar_url} alt={run.actor.login} />
                  <AvatarFallback className="text-[10px]">
                    {run.actor.login[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{run.actor.login}</span>
              </span>
            )}

            {duration && (
              <span className="ml-auto text-xs text-muted-foreground tabular-nums shrink-0">
                {duration}
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Jobs */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {jobs.length === 0
            ? "No jobs"
            : `${jobs.length} job${jobs.length === 1 ? "" : "s"}`}
        </h2>
        <JobTree jobs={jobs} />
      </div>
    </div>
  );
}
