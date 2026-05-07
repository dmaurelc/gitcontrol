import Link from "next/link";
import { GitBranch, GitCommit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MagicCard } from "@/components/ui/magic-card";
import { RunStatusIcon } from "./run-status-icon";
import type { WorkflowRun } from "@/lib/github/service";

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

type Props = {
  run: WorkflowRun;
  owner: string;
  repo: string;
};

export function RunRow({ run, owner, repo }: Props) {
  const href = `/repositories/${owner}/${repo}/actions/${run.id}`;
  const commitMsg = run.head_commit?.message?.split("\n")[0] ?? "";
  const shortSha = run.head_sha.slice(0, 7);
  const duration =
    run.status === "completed"
      ? formatDuration(run.created_at, run.updated_at)
      : null;

  return (
    <Link href={href} className="group block focus-visible:outline-none">
      <Card className="overflow-hidden border-none bg-transparent p-0 shadow-card transition-all group-hover:-translate-y-0.5 group-hover:shadow-card-hover group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <MagicCard
          gradientFrom="var(--color-chart-1)"
          gradientTo="var(--color-chart-2)"
          gradientColor="color-mix(in oklch, var(--color-chart-1) 18%, transparent)"
          gradientSize={260}
          className="rounded-xl p-0"
        >
          <CardContent className="flex items-center gap-3 px-4 py-3">
            {/* Status icon */}
            <RunStatusIcon status={run.status} conclusion={run.conclusion} />

            {/* Workflow + run info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="truncate text-sm font-semibold leading-tight">
                  {run.display_title || run.name || `Run #${run.run_number}`}
                </span>
                <Badge
                  variant={conclusionVariant(run.status, run.conclusion)}
                  className="shrink-0 text-[10px] px-1.5 py-0"
                >
                  {conclusionLabel(run.status, run.conclusion)}
                </Badge>
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                {run.name && (
                  <span className="truncate max-w-[160px]">{run.name}</span>
                )}
                {run.head_branch && (
                  <span className="flex items-center gap-1 shrink-0">
                    <GitBranch className="size-3" />
                    <span className="max-w-[120px] truncate">{run.head_branch}</span>
                  </span>
                )}
                {commitMsg && (
                  <span className="flex items-center gap-1 min-w-0">
                    <GitCommit className="size-3 shrink-0" />
                    <span className="truncate max-w-[200px]">{commitMsg}</span>
                    <span className="shrink-0 font-mono text-[10px]">{shortSha}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Actor + duration */}
            <div className="flex shrink-0 items-center gap-3">
              {duration && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {duration}
                </span>
              )}
              {run.actor && (
                <Avatar className="size-6">
                  <AvatarImage src={run.actor.avatar_url} alt={run.actor.login} />
                  <AvatarFallback className="text-[10px]">
                    {run.actor.login[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </CardContent>
        </MagicCard>
      </Card>
    </Link>
  );
}
