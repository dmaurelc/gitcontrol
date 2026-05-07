import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Activity } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { PaginationNav } from "@/components/pagination-nav";
import { RunRow } from "./_components/run-row";
import { RunsFilters } from "./_components/runs-filters";
import type { WorkflowRunStatus, WorkflowRun, Workflow } from "@/lib/github/service";

type SP = {
  status?: string;
  workflow?: string;
  branch?: string;
  page?: string;
};

export default async function ActionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ owner: string; repo: string }>;
  searchParams: Promise<SP>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { owner, repo } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1"));
  const statusRaw = sp.status ?? "all";
  const workflowIdRaw = sp.workflow ? Number(sp.workflow) : undefined;
  const branch = sp.branch?.trim() || undefined;

  // Validate status is a recognized value (pass undefined if "all")
  const validStatuses: WorkflowRunStatus[] = [
    "queued",
    "in_progress",
    "completed",
    "waiting",
    "requested",
    "pending",
  ];
  const status = validStatuses.includes(statusRaw as WorkflowRunStatus)
    ? (statusRaw as WorkflowRunStatus)
    : undefined;

  let runs: WorkflowRun[] = [];
  let workflows: Workflow[] = [];

  const [runsResult, workflowsResult] = await Promise.allSettled([
    githubService.listWorkflowRuns(session.user.id, owner, repo, {
      page,
      perPage: 30,
      status,
      branch,
      workflowId: workflowIdRaw,
    }),
    githubService.listWorkflows(session.user.id, owner, repo),
  ]);

  if (runsResult.status === "fulfilled") runs = runsResult.value;
  if (workflowsResult.status === "fulfilled") workflows = workflowsResult.value;

  const basePath = `/repositories/${owner}/${repo}/actions`;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        plain
        title="Actions"
        description={
          workflows.length > 0
            ? `${workflows.length} workflow${workflows.length === 1 ? "" : "s"}`
            : "Workflow runs for this repository"
        }
      />

      {/* Filters — client component for instant interactivity */}
      <RunsFilters owner={owner} repo={repo} workflows={workflows} />

      {runs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No workflow runs"
          description={
            status || branch || workflowIdRaw
              ? "No runs match the current filters."
              : "This repository has no workflow runs yet."
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {runs.map((run) => (
            <li key={run.id}>
              <RunRow run={run} owner={owner} repo={repo} />
            </li>
          ))}
        </ul>
      )}

      {(runs.length === 30 || page > 1) && (
        <PaginationNav
          basePath={basePath}
          page={page}
          hasNext={runs.length === 30}
        />
      )}
    </div>
  );
}
