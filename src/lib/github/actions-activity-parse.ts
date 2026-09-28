/**
 * Pure aggregation helpers for Actions *activity* (workflow runs). Independent
 * of GitHub network access so it can be unit-tested directly.
 *
 * A "run" here is a minimal structural subset of GitHub's workflow run object,
 * so callers can pass `WorkflowRun[]` without importing server-only code.
 */

export type RunLike = {
  id?: number;
  name?: string | null;
  display_title?: string;
  run_number?: number;
  status?: string | null;
  conclusion?: string | null;
  created_at?: string | null;
  run_started_at?: string | null;
  updated_at?: string | null;
  html_url?: string;
};

export type RepoActivityStat = {
  repo: string;
  owner: string;
  name: string;
  runs: number;
  success: number;
  failure: number;
  /** 0..1 over concluded runs, or null when nothing concluded. */
  successRate: number | null;
  /** Average completed-run duration in seconds. */
  avgDurationSeconds: number | null;
  truncated: boolean;
};

export type WorkflowActivityStat = {
  key: string;
  repo: string;
  workflow: string;
  runs: number;
  failures: number;
  avgDurationSeconds: number | null;
};

export type FailedRun = {
  id: number;
  repo: string;
  workflow: string;
  conclusion: string;
  title: string;
  updatedAt: string;
  htmlUrl: string;
  runNumber: number;
};

const FAILURE_CONCLUSIONS = new Set(["failure", "timed_out", "action_required"]);

export function isFailureConclusion(conclusion: string | null | undefined): boolean {
  return FAILURE_CONCLUSIONS.has((conclusion ?? "").toLowerCase());
}

/**
 * Duration of a completed run in seconds, derived from
 * `updated_at - run_started_at` (falling back to `created_at`). Returns null
 * for runs without usable timestamps or with a negative delta.
 */
export function durationSeconds(run: RunLike): number | null {
  const start = run.run_started_at ?? run.created_at;
  if (!start || !run.updated_at) return null;
  const ms = new Date(run.updated_at).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return Math.round(ms / 1000);
}

export function summarizeRepoRuns(
  owner: string,
  name: string,
  runs: RunLike[],
  opts: { truncated?: boolean } = {},
): RepoActivityStat {
  let success = 0;
  let failure = 0;
  let durSum = 0;
  let durCount = 0;

  for (const run of runs) {
    const conclusion = (run.conclusion ?? "").toLowerCase();
    if (conclusion === "success") success++;
    else if (isFailureConclusion(conclusion)) failure++;

    if ((run.status ?? "") === "completed") {
      const d = durationSeconds(run);
      if (d != null) {
        durSum += d;
        durCount++;
      }
    }
  }

  const concluded = success + failure;
  return {
    repo: `${owner}/${name}`,
    owner,
    name,
    runs: runs.length,
    success,
    failure,
    successRate: concluded > 0 ? success / concluded : null,
    avgDurationSeconds: durCount > 0 ? Math.round(durSum / durCount) : null,
    truncated: opts.truncated ?? false,
  };
}

export function summarizeWorkflows(
  repo: string,
  runs: RunLike[],
): WorkflowActivityStat[] {
  type Acc = { runs: number; failures: number; durSum: number; durCount: number };
  const map = new Map<string, Acc>();

  for (const run of runs) {
    const workflow = (run.name ?? "").trim() || "Unknown workflow";
    const acc = map.get(workflow) ?? { runs: 0, failures: 0, durSum: 0, durCount: 0 };
    acc.runs++;
    if (isFailureConclusion(run.conclusion)) acc.failures++;
    if ((run.status ?? "") === "completed") {
      const d = durationSeconds(run);
      if (d != null) {
        acc.durSum += d;
        acc.durCount++;
      }
    }
    map.set(workflow, acc);
  }

  return [...map.entries()]
    .map(([workflow, acc]) => ({
      key: `${repo}::${workflow}`,
      repo,
      workflow,
      runs: acc.runs,
      failures: acc.failures,
      avgDurationSeconds: acc.durCount > 0 ? Math.round(acc.durSum / acc.durCount) : null,
    }))
    .sort((a, b) => b.runs - a.runs);
}

export function collectFailedRuns(
  repo: string,
  runs: RunLike[],
  limit = 10,
): FailedRun[] {
  return runs
    .filter((run) => isFailureConclusion(run.conclusion))
    .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))
    .slice(0, limit)
    .map((run) => ({
      id: run.id ?? 0,
      repo,
      workflow: (run.name ?? "").trim() || "Workflow",
      conclusion: (run.conclusion ?? "failure").toLowerCase(),
      title: run.display_title ?? "",
      updatedAt: run.updated_at ?? "",
      htmlUrl: run.html_url ?? "",
      runNumber: run.run_number ?? 0,
    }));
}
