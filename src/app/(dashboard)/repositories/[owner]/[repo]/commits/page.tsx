import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GitBranch, GitCommit } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import {
  githubService,
  type RepoBranchRef,
  type RepoCommit,
  type RepoContributor,
} from "@/lib/github/service";
import { EmptyState } from "@/components/empty-state";
import { CommitsFilters } from "./_components/commits-filters";
import { CommitsList } from "./_components/commits-list";
import { CommitsPagination } from "./_components/commits-pagination";

type SearchParams = {
  branch?: string;
  author?: string;
  since?: string;
  until?: string;
  page?: string;
};

const PER_PAGE = 30;

export default async function RepoCommitsPage({
  params,
  searchParams,
}: {
  params: Promise<{ owner: string; repo: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");
  const userId = session.user.id;
  const { owner, repo } = await params;
  const sp = await searchParams;

  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const branchParam = sp.branch?.trim() || undefined;
  const authorParam = sp.author?.trim() || undefined;
  const sinceParam = sp.since?.trim() || undefined;
  const untilParam = sp.until?.trim() || undefined;

  let defaultBranch: string | undefined;
  try {
    const r = await githubService.getRepo(userId, owner, repo);
    defaultBranch = r.data.default_branch;
  } catch {}

  const effectiveBranch = branchParam ?? defaultBranch;

  const sinceISO = sinceParam ? `${sinceParam}T00:00:00Z` : undefined;
  // GitHub `until` is exclusive of the boundary date, so pin to end-of-day UTC.
  const untilISO = untilParam ? `${untilParam}T23:59:59Z` : undefined;

  const [branchesRes, contributorsRes, commitsRes] = await Promise.allSettled([
    githubService.listBranches(userId, owner, repo, 100),
    githubService.listContributors(userId, owner, repo, 30),
    githubService.listCommits(userId, owner, repo, {
      sha: effectiveBranch,
      author: authorParam,
      since: sinceISO,
      until: untilISO,
      perPage: PER_PAGE,
      page,
    }),
  ]);

  const branches: RepoBranchRef[] =
    branchesRes.status === "fulfilled" ? branchesRes.value.data : [];
  const contributors: RepoContributor[] =
    contributorsRes.status === "fulfilled" ? contributorsRes.value.data : [];

  let commits: RepoCommit[] = [];
  let error: string | null = null;
  if (commitsRes.status === "fulfilled") {
    commits = commitsRes.value.data;
  } else {
    const e = commitsRes.reason as { message?: string };
    error = e?.message ?? "Unable to load commits.";
  }

  const hasNextPage = commits.length === PER_PAGE;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GitCommit className="size-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">Commits</h2>
        </div>
        {effectiveBranch ? (
          <span className="inline-flex items-center gap-1 rounded border bg-background px-2 py-0.5 font-mono text-[0.6875rem] text-muted-foreground">
            <GitBranch className="size-3" />
            {effectiveBranch}
          </span>
        ) : null}
      </div>

      <CommitsFilters
        owner={owner}
        repo={repo}
        branches={branches}
        contributors={contributors}
        selectedBranch={branchParam ?? defaultBranch ?? ""}
        selectedAuthor={authorParam ?? ""}
        since={sinceParam ?? ""}
        until={untilParam ?? ""}
      />

      {error ? (
        <EmptyState
          icon={GitCommit}
          title="Couldn't load commits"
          description={error}
        />
      ) : commits.length === 0 ? (
        <EmptyState
          icon={GitCommit}
          title="No commits found"
          description="Try widening the date range or removing filters."
        />
      ) : (
        <>
          <CommitsList commits={commits} />
          <CommitsPagination
            owner={owner}
            repo={repo}
            page={page}
            hasNextPage={hasNextPage}
            branch={branchParam}
            author={authorParam}
            since={sinceParam}
            until={untilParam}
          />
        </>
      )}
    </div>
  );
}
