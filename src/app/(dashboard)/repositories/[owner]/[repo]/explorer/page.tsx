import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth/auth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getUserPreferences,
  readRepoDetailViewMode,
} from "@/lib/preferences/get-user-preferences";
import {
  githubService,
  type RepoBranchRef,
  type RepoCommit,
  type RepoTag,
} from "@/lib/github/service";
import type { ExplorerPr } from "./_components/explorer-types";
import {
  ExplorerLayout,
  ExplorerMobileFallback,
} from "./_components/explorer-layout";
import { LeftPanel } from "./_components/left-panel";
import { CommitsPanel } from "./_components/commits-panel";
import { RightPanel } from "./_components/right-panel";
import { CommitDetail } from "./_components/commit-detail";

const SHA_REGEX = /^[a-f0-9]{7,40}$/;

type SearchParams = {
  branch?: string;
  commit?: string;
  leftTab?: string;
  page?: string;
};

const COMMITS_PER_PAGE = 30;

export default async function RepoExplorerPage({
  params,
  searchParams,
}: {
  params: Promise<{ owner: string; repo: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const prefs = await getUserPreferences(session.user.id);
  if (readRepoDetailViewMode(prefs.filters) === "tabs") {
    const { owner, repo } = await params;
    redirect(`/repositories/${owner}/${repo}`);
  }

  const userId = session.user.id;
  const { owner, repo } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  // Resolve default branch once; used as fallback for commits query.
  let defaultBranch: string | undefined;
  try {
    const r = await githubService.getRepo(userId, owner, repo);
    defaultBranch = r.data.default_branch;
  } catch {
    // Best-effort: empty paneles will show empty states.
  }

  const effectiveBranch = sp.branch?.trim() || defaultBranch;

  const [branchesRes, prsRes, tagsRes, commitsRes] = await Promise.allSettled([
    githubService.listBranches(userId, owner, repo, 100),
    githubService.listPullRequests(userId, owner, repo, "open", 1, 30),
    githubService.listTags(userId, owner, repo, 50),
    githubService.listCommits(userId, owner, repo, {
      sha: effectiveBranch,
      perPage: COMMITS_PER_PAGE,
      page,
    }),
  ]);

  const branches: RepoBranchRef[] =
    branchesRes.status === "fulfilled" ? branchesRes.value.data : [];
  const prs: ExplorerPr[] =
    prsRes.status === "fulfilled"
      ? (prsRes.value.data as ExplorerPr[])
      : [];
  const tags: RepoTag[] =
    tagsRes.status === "fulfilled" ? tagsRes.value.data : [];

  let commits: RepoCommit[] = [];
  let commitsError: string | null = null;
  if (commitsRes.status === "fulfilled") {
    commits = commitsRes.value.data;
  } else {
    const e = commitsRes.reason as { message?: string };
    commitsError = e?.message ?? "Failed to load commits.";
  }

  const hasMore = commits.length === COMMITS_PER_PAGE;

  const commitSha = sp.commit?.trim();
  const validSha = commitSha && SHA_REGEX.test(commitSha) ? commitSha : "";

  return (
    <>
      <ExplorerMobileFallback />
      <ExplorerLayout
        left={
          <LeftPanel
            branches={branches}
            prs={prs}
            tags={tags}
            defaultBranch={defaultBranch}
          />
        }
        center={
          <CommitsPanel
            commits={commits}
            branchName={effectiveBranch ?? ""}
            error={commitsError}
            hasMore={hasMore}
          />
        }
        right={
          <RightPanel hasCommit={Boolean(validSha)}>
            {validSha ? (
              <Suspense
                key={validSha}
                fallback={
                  <div className="flex flex-col gap-2 p-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="mt-4 h-32 w-full" />
                  </div>
                }
              >
                <CommitDetail
                  userId={userId}
                  owner={owner}
                  repo={repo}
                  sha={validSha}
                />
              </Suspense>
            ) : null}
          </RightPanel>
        }
      />
    </>
  );
}
