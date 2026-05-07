import { RunStatusIcon } from "../../_components/run-status-icon";
import type { WorkflowJob } from "@/lib/github/service";

function formatDuration(
  startIso: string | null,
  endIso: string | null,
): string | null {
  if (!startIso || !endIso) return null;
  const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (diffMs <= 0) return "0s";
  const totalSec = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

type StepConclusion = string | null;

function stepStatusIcon(
  status: WorkflowJob["steps"][number]["status"],
  conclusion: StepConclusion,
) {
  // Reuse RunStatusIcon by mapping step status/conclusion to the same shape
  const mapped =
    status === "completed"
      ? conclusion === "success"
        ? { status: "completed" as const, conclusion: "success" as const }
        : conclusion === "failure"
          ? { status: "completed" as const, conclusion: "failure" as const }
          : conclusion === "skipped"
            ? { status: "completed" as const, conclusion: "skipped" as const }
            : { status: "completed" as const, conclusion: "neutral" as const }
      : status === "in_progress"
        ? { status: "in_progress" as const, conclusion: null }
        : { status: "queued" as const, conclusion: null };

  return (
    <RunStatusIcon
      status={mapped.status}
      conclusion={mapped.conclusion}
      className="size-3.5"
      animate={false}
    />
  );
}

type Props = {
  jobs: WorkflowJob[];
};

export function JobTree({ jobs }: Props) {
  if (jobs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No jobs found for this run.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {jobs.map((job) => {
        const jobDuration = formatDuration(job.started_at, job.completed_at);
        return (
          <li key={job.id} className="rounded-xl border bg-card overflow-hidden">
            <details>
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 hover:bg-muted/40 transition-colors">
                <RunStatusIcon
                  status={job.status}
                  conclusion={
                    job.conclusion as WorkflowJob["conclusion"] extends string
                      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        any
                      : null
                  }
                  className="size-4 shrink-0"
                />
                <span className="flex-1 text-sm font-medium">{job.name}</span>
                {jobDuration && (
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {jobDuration}
                  </span>
                )}
                {/* Chevron indicator via CSS — no extra dep */}
                <span
                  className="ml-1 text-muted-foreground text-xs select-none shrink-0"
                  aria-hidden
                >
                  ▸
                </span>
              </summary>

              {/* Steps list */}
              {job.steps && job.steps.length > 0 ? (
                <ul className="border-t divide-y">
                  {job.steps.map((step) => {
                    const stepDuration = formatDuration(
                      step.started_at,
                      step.completed_at,
                    );
                    return (
                      <li
                        key={step.number}
                        className="flex items-center gap-2 px-4 py-2 text-sm"
                      >
                        <span className="w-5 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                          {step.number}
                        </span>
                        {stepStatusIcon(step.status, step.conclusion)}
                        <span className="flex-1 min-w-0 truncate text-muted-foreground">
                          {step.name}
                        </span>
                        {stepDuration && (
                          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                            {stepDuration}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="px-4 py-3 text-xs text-muted-foreground">
                  No step data available.
                </p>
              )}
            </details>
          </li>
        );
      })}
    </ul>
  );
}
