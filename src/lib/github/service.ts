import "server-only";
import { getGithubClients } from "./client";
import { cachedFetch, TTL, invalidate } from "./cache";
import { mapGithubError } from "./errors";

// Octokit endpoint methods are strongly typed per route, but we treat them as
// generic callables here. The unknown body type flows through cachedFetch and
// callers can narrow at the use site. For better DX in callers we expose the
// raw `data` shape via the cachedFetch return.
type AnyEndpoint = (
  params: Record<string, unknown>,
) => Promise<{ data: unknown; headers: Record<string, string | undefined> }>;

async function etagFetch(
  endpoint: AnyEndpoint,
  baseParams: Record<string, unknown>,
  prevEtag: string | undefined,
): Promise<
  | { notModified: true }
  | { notModified: false; body: unknown; etag?: string }
> {
  try {
    const params: Record<string, unknown> = { ...baseParams };
    if (prevEtag) {
      params.headers = {
        ...(params.headers as object | undefined),
        "If-None-Match": prevEtag,
      };
    }
    const res = await endpoint(params);
    return { notModified: false, body: res.data, etag: res.headers.etag };
  } catch (err) {
    const e = err as { status?: number };
    if (e.status === 304) return { notModified: true };
    throw mapGithubError(err);
  }
}

type RepoListAffiliation = "owner" | "collaborator" | "organization_member";
type RepoVisibility = "all" | "public" | "private";
type RepoSort = "created" | "updated" | "pushed" | "full_name";

export type ListReposParams = {
  affiliation?: RepoListAffiliation[];
  visibility?: RepoVisibility;
  sort?: RepoSort;
  direction?: "asc" | "desc";
  perPage?: number;
  page?: number;
};

export type CreateRepoInput = {
  name: string;
  description?: string;
  private?: boolean;
  autoInit?: boolean;
  gitignoreTemplate?: string;
  licenseTemplate?: string;
};

// Common GitHub response shapes (subset, only fields we use). Full types come
// from @octokit/rest's response unions but we keep this surface narrow.
export type Viewer = {
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
  public_repos: number;
  total_private_repos?: number;
  followers: number;
  following: number;
};

export type Org = {
  login: string;
  id: number;
  avatar_url: string;
  description: string | null;
};

export type Repo = {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; avatar_url: string };
  private: boolean;
  description: string | null;
  fork: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string;
  updated_at: string;
  default_branch: string;
  archived?: boolean;
};

export type IssueLabel = {
  id: number;
  name: string;
  color: string;
};

export type Issue = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  user: { login: string; avatar_url: string } | null;
  labels: IssueLabel[];
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
  pull_request?: unknown;
};

export type IssueComment = {
  id: number;
  body: string | null;
  user: { login: string; avatar_url: string } | null;
  created_at: string;
  updated_at: string;
  html_url: string;
};

export type CreateIssueInput = {
  title: string;
  body?: string;
  labels?: string[];
};

export type PullRequest = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  merged: boolean;
  merged_at: string | null;
  draft: boolean;
  user: { login: string; avatar_url: string } | null;
  labels: IssueLabel[];
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
  head: { ref: string; sha: string };
  base: { ref: string };
  additions: number;
  deletions: number;
  changed_files: number;
};

// ─── Actions / Workflow Runs ─────────────────────────────────────────────────

export type WorkflowRunStatus =
  | "queued"
  | "in_progress"
  | "completed"
  | "waiting"
  | "requested"
  | "pending";

export type WorkflowRunConclusion =
  | "success"
  | "failure"
  | "cancelled"
  | "skipped"
  | "neutral"
  | "timed_out"
  | "action_required"
  | null;

export type WorkflowRun = {
  id: number;
  name: string | null;
  display_title: string;
  run_number: number;
  status: WorkflowRunStatus | null;
  conclusion: WorkflowRunConclusion;
  workflow_id: number;
  head_branch: string | null;
  head_sha: string;
  head_commit: { message: string } | null;
  actor: { login: string; avatar_url: string } | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  path: string;
};

export type WorkflowJobStep = {
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion: string | null;
  number: number;
  started_at: string | null;
  completed_at: string | null;
};

export type WorkflowJob = {
  id: number;
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion: string | null;
  started_at: string | null;
  completed_at: string | null;
  steps: WorkflowJobStep[];
  html_url: string | null;
};

export type Workflow = {
  id: number;
  name: string;
  path: string;
  state:
    | "active"
    | "deleted"
    | "disabled_fork"
    | "disabled_inactivity"
    | "disabled_manually";
};

export type ListWorkflowRunsOpts = {
  page?: number;
  perPage?: number;
  status?: WorkflowRunStatus | "all";
  branch?: string;
  workflowId?: number;
};

// ─── Activity Events ─────────────────────────────────────────────────────────

export type ViewerEventPayload = {
  action?: string;
  ref?: string;
  ref_type?: string;
  forkee?: { full_name: string };
  pull_request?: { number: number; title: string };
  issue?: { number: number; title: string };
  commits?: Array<{ message: string }>;
  size?: number;
};

export type ViewerEvent = {
  id: string;
  type: string | null;
  actor: { login: string; avatar_url: string };
  repo: { name: string };
  created_at: string | null;
  payload: ViewerEventPayload;
};

// ─── Notifications ────────────────────────────────────────────────────────────

export type GitHubNotification = {
  id: string;
  unread: boolean;
  reason: string;
  subject: {
    title: string;
    type: string;
    url: string | null;
  };
  repository: { full_name: string };
  updated_at: string;
};

// ─── Tags / Releases / Contributors ───────────────────────────────────────────

export type RepoTag = {
  name: string;
  commit: { sha: string; url: string };
  zipball_url: string;
  tarball_url: string;
};

export type RepoRelease = {
  id: number;
  name: string | null;
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  published_at: string | null;
  created_at: string;
  html_url: string;
  body: string | null;
};

export type RepoContributor = {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
};

// ─── Repo contents ────────────────────────────────────────────────────────────

export type RepoDirEntry = {
  type: "file" | "dir" | "submodule" | "symlink";
  name: string;
  path: string;
  sha: string;
  size: number;
  html_url: string | null;
  download_url: string | null;
};

export type RepoFileContent = {
  type: "file";
  name: string;
  path: string;
  size: number;
  encoding: string;
  content: string;
  sha: string;
  html_url: string | null;
  download_url: string | null;
};

export type RepoContentResult =
  | { kind: "dir"; entries: RepoDirEntry[] }
  | { kind: "file"; file: RepoFileContent };

// ─── Insights stats ───────────────────────────────────────────────────────────

export type CommitActivityWeek = {
  week: number; // unix epoch (seconds)
  total: number;
  days: number[]; // 7 entries Sun-Sat
};

export type CodeFrequencyWeek = [number, number, number]; // [week, additions, deletions]

export type RepoTrafficViews = {
  count: number;
  uniques: number;
  views: Array<{ timestamp: string; count: number; uniques: number }>;
};

export type RepoTraffic = {
  views: RepoTrafficViews | null;
  clones: RepoTrafficViews | null;
  restricted: boolean;
};

// ─── Search (cross-repo issues/PRs) ───────────────────────────────────────────

export type SearchIssueItem = {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  html_url: string;
  repository_url: string;
  pull_request?: { url: string } | null;
  user: { login: string; avatar_url: string } | null;
  created_at: string;
  updated_at: string;
  comments: number;
  draft?: boolean;
};

export type SearchIssuesResult = {
  total_count: number;
  incomplete_results: boolean;
  items: SearchIssueItem[];
};

export type SearchIssuesOpts = {
  type: "pr" | "issue";
  state?: "open" | "closed";
  scope?: "author" | "assignee" | "mentions";
  org?: string;
  page?: number;
  perPage?: number;
};

// ─── Contributions ────────────────────────────────────────────────────────────

export type ContributionDay = {
  date: string;
  count: number;
};

export const githubService = {
  async getViewer(userId: string) {
    const { rest } = await getGithubClients(userId);
    return cachedFetch<Viewer>({
      userId,
      resource: "viewer",
      ttlSeconds: TTL.viewer,
      fetcher: (etag) =>
        etagFetch(
          rest.users.getAuthenticated as unknown as AnyEndpoint,
          {},
          etag,
        ) as ReturnType<typeof etagFetch> as Promise<
          | { notModified: true }
          | { notModified: false; body: Viewer; etag?: string }
        >,
    });
  },

  async listOrgs(userId: string) {
    const { rest } = await getGithubClients(userId);
    return cachedFetch<Org[]>({
      userId,
      resource: "orgs",
      ttlSeconds: TTL.orgs,
      fetcher: (etag) =>
        etagFetch(
          rest.orgs.listForAuthenticatedUser as unknown as AnyEndpoint,
          { per_page: 100 },
          etag,
        ) as Promise<
          | { notModified: true }
          | { notModified: false; body: Org[]; etag?: string }
        >,
    });
  },

  async listRepos(userId: string, params: ListReposParams = {}) {
    const { rest } = await getGithubClients(userId);
    const apiParams = {
      affiliation: (params.affiliation ?? [
        "owner",
        "collaborator",
        "organization_member",
      ]).join(","),
      visibility: params.visibility ?? "all",
      sort: params.sort ?? "updated",
      direction: params.direction ?? "desc",
      per_page: params.perPage ?? 30,
      page: params.page ?? 1,
    };
    return cachedFetch<Repo[]>({
      userId,
      resource: "repos",
      params: apiParams,
      ttlSeconds: TTL.repos,
      fetcher: (etag) =>
        etagFetch(
          rest.repos.listForAuthenticatedUser as unknown as AnyEndpoint,
          apiParams,
          etag,
        ) as Promise<
          | { notModified: true }
          | { notModified: false; body: Repo[]; etag?: string }
        >,
    });
  },

  async getRepo(userId: string, owner: string, repo: string) {
    const { rest } = await getGithubClients(userId);
    return cachedFetch<Repo>({
      userId,
      resource: "repo",
      params: { owner, repo },
      ttlSeconds: TTL.repo,
      fetcher: (etag) =>
        etagFetch(
          rest.repos.get as unknown as AnyEndpoint,
          { owner, repo },
          etag,
        ) as Promise<
          | { notModified: true }
          | { notModified: false; body: Repo; etag?: string }
        >,
    });
  },

  async getReadme(userId: string, owner: string, repo: string) {
    const { rest } = await getGithubClients(userId);
    return cachedFetch<{ content: string; encoding: string }>({
      userId,
      resource: "readme",
      params: { owner, repo },
      ttlSeconds: TTL.readme,
      fetcher: (etag) =>
        etagFetch(
          rest.repos.getReadme as unknown as AnyEndpoint,
          { owner, repo },
          etag,
        ) as Promise<
          | { notModified: true }
          | {
              notModified: false;
              body: { content: string; encoding: string };
              etag?: string;
            }
        >,
    });
  },

  /**
   * Returns the language byte-counts for a repo, e.g. { TypeScript: 12345,
   * CSS: 678 }. Cached with TTL.languages (1h).
   */
  async getLanguages(userId: string, owner: string, repo: string) {
    const { rest } = await getGithubClients(userId);
    const params = { owner, repo };
    return cachedFetch<Record<string, number>>({
      userId,
      resource: "languages",
      params,
      ttlSeconds: TTL.languages,
      fetcher: (etag) =>
        etagFetch(
          rest.repos.listLanguages as unknown as AnyEndpoint,
          params,
          etag,
        ) as Promise<
          | { notModified: true }
          | { notModified: false; body: Record<string, number>; etag?: string }
        >,
    });
  },

  /**
   * Computes the full repo health score by reading `pushed_at`, recent open
   * PRs, recent open issues, and the latest workflow run conclusion in
   * parallel. Result is memoized in Redis for `TTL.repoHealth` so the
   * breakdown panel on the repo overview is cheap on repeat renders.
   */
  async getRepoHealth(userId: string, owner: string, repo: string) {
    const { computeHealthScore } = await import("./health-score");
    const params = { owner, repo };
    return cachedFetch<ReturnType<typeof computeHealthScore>>({
      userId,
      resource: "repoHealth",
      params,
      ttlSeconds: TTL.repoHealth,
      fetcher: async () => {
        const repoSelf = this as unknown as typeof githubService;
        const [repoRes, prsRes, issuesRes, runs] = await Promise.allSettled([
          repoSelf.getRepo(userId, owner, repo),
          repoSelf.listPullRequests(userId, owner, repo, "open", 1, 30),
          repoSelf.listIssues(userId, owner, repo, "open", 1, 30),
          repoSelf.listWorkflowRuns(userId, owner, repo, { perPage: 1 }),
        ]);
        const pushedAt =
          repoRes.status === "fulfilled"
            ? (repoRes.value.data as { pushed_at: string }).pushed_at
            : null;
        const openPrCreatedAt =
          prsRes.status === "fulfilled"
            ? (prsRes.value.data as Array<{ created_at: string }>).map(
                (p) => p.created_at,
              )
            : [];
        const openIssueUpdatedAt =
          issuesRes.status === "fulfilled"
            ? (issuesRes.value.data as Array<{
                updated_at: string;
                pull_request?: unknown;
              }>)
                .filter((i) => !i.pull_request)
                .map((i) => i.updated_at)
            : [];
        const lastRun =
          runs.status === "fulfilled" && runs.value.length > 0
            ? runs.value[0]
            : null;
        const lastRunConclusion = (lastRun?.conclusion ?? null) as
          Parameters<typeof computeHealthScore>[0]["lastRunConclusion"];
        const score = computeHealthScore({
          pushedAt,
          openPrCreatedAt,
          openIssueUpdatedAt,
          lastRunConclusion,
        });
        return { notModified: false as const, body: score };
      },
    });
  },

  async listTags(userId: string, owner: string, repo: string, perPage = 6) {
    const { rest } = await getGithubClients(userId);
    const params = { owner, repo, per_page: perPage };
    return cachedFetch<RepoTag[]>({
      userId,
      resource: "tags",
      params,
      ttlSeconds: TTL.tags,
      fetcher: (etag) =>
        etagFetch(rest.repos.listTags as unknown as AnyEndpoint, params, etag) as Promise<
          | { notModified: true }
          | { notModified: false; body: RepoTag[]; etag?: string }
        >,
    });
  },

  async listReleases(userId: string, owner: string, repo: string, perPage = 6) {
    const { rest } = await getGithubClients(userId);
    const params = { owner, repo, per_page: perPage };
    return cachedFetch<RepoRelease[]>({
      userId,
      resource: "releases",
      params,
      ttlSeconds: TTL.releases,
      fetcher: (etag) =>
        etagFetch(rest.repos.listReleases as unknown as AnyEndpoint, params, etag) as Promise<
          | { notModified: true }
          | { notModified: false; body: RepoRelease[]; etag?: string }
        >,
    });
  },

  async listContributors(userId: string, owner: string, repo: string, perPage = 8) {
    const { rest } = await getGithubClients(userId);
    const params = { owner, repo, per_page: perPage };
    return cachedFetch<RepoContributor[]>({
      userId,
      resource: "contributors",
      params,
      ttlSeconds: TTL.contributors,
      fetcher: async (etag) => {
        try {
          const reqParams: Record<string, unknown> = { ...params };
          if (etag) reqParams.headers = { "If-None-Match": etag };
          const res = await rest.repos.listContributors(
            reqParams as Parameters<typeof rest.repos.listContributors>[0],
          );
          return {
            notModified: false as const,
            body: res.data as unknown as RepoContributor[],
            etag: res.headers.etag,
          };
        } catch (err) {
          const e = err as { status?: number };
          if (e.status === 304) return { notModified: true as const };
          // 204 No Content (empty repo) → empty array
          if (e.status === 204) {
            return { notModified: false as const, body: [] };
          }
          throw mapGithubError(err);
        }
      },
    });
  },

  /**
   * Fetches a path inside a repo. If path is a directory, returns a dir listing.
   * If path is a file, returns its decoded metadata + content (base64).
   */
  async getContent(
    userId: string,
    owner: string,
    repo: string,
    path = "",
    ref?: string,
  ): Promise<{ data: RepoContentResult }> {
    const { rest } = await getGithubClients(userId);
    const params: Record<string, unknown> = { owner, repo, path };
    if (ref) params.ref = ref;
    return cachedFetch<RepoContentResult>({
      userId,
      resource: "contents",
      params,
      ttlSeconds: TTL.contents,
      fetcher: async (etag) => {
        try {
          const reqParams: Record<string, unknown> = { ...params };
          if (etag) reqParams.headers = { "If-None-Match": etag };
          const res = await rest.repos.getContent(
            reqParams as Parameters<typeof rest.repos.getContent>[0],
          );
          if (Array.isArray(res.data)) {
            return {
              notModified: false as const,
              body: { kind: "dir" as const, entries: res.data as unknown as RepoDirEntry[] },
              etag: res.headers.etag,
            };
          }
          return {
            notModified: false as const,
            body: { kind: "file" as const, file: res.data as unknown as RepoFileContent },
            etag: res.headers.etag,
          };
        } catch (err) {
          const e = err as { status?: number };
          if (e.status === 304) return { notModified: true as const };
          throw mapGithubError(err);
        }
      },
    });
  },

  /**
   * Returns weekly commit counts for the last 52 weeks. May return empty when
   * GitHub is still computing (HTTP 202).
   */
  async getCommitActivity(
    userId: string,
    owner: string,
    repo: string,
  ): Promise<{ data: CommitActivityWeek[] | null }> {
    const { rest } = await getGithubClients(userId);
    const params = { owner, repo };
    return cachedFetch<CommitActivityWeek[] | null>({
      userId,
      resource: "commit-activity",
      params,
      ttlSeconds: TTL.commitActivity,
      fetcher: async () => {
        try {
          const res = await rest.repos.getCommitActivityStats(params);
          // 202: GitHub is computing — return null sentinel
          if (res.status === 202 || !res.data) {
            return { notModified: false as const, body: null };
          }
          return {
            notModified: false as const,
            body: res.data as unknown as CommitActivityWeek[],
          };
        } catch (err) {
          throw mapGithubError(err);
        }
      },
    });
  },

  async getCodeFrequency(
    userId: string,
    owner: string,
    repo: string,
  ): Promise<{ data: CodeFrequencyWeek[] | null }> {
    const { rest } = await getGithubClients(userId);
    const params = { owner, repo };
    return cachedFetch<CodeFrequencyWeek[] | null>({
      userId,
      resource: "code-frequency",
      params,
      ttlSeconds: TTL.codeFrequency,
      fetcher: async () => {
        try {
          const res = await rest.repos.getCodeFrequencyStats(params);
          if (res.status === 202 || !res.data) {
            return { notModified: false as const, body: null };
          }
          return {
            notModified: false as const,
            body: res.data as unknown as CodeFrequencyWeek[],
          };
        } catch (err) {
          throw mapGithubError(err);
        }
      },
    });
  },

  /**
   * Combines views + clones (14d). Requires push permission. On 403 returns
   * `restricted: true` and null payloads, no throw.
   */
  async getRepoTraffic(
    userId: string,
    owner: string,
    repo: string,
  ): Promise<{ data: RepoTraffic }> {
    const { rest } = await getGithubClients(userId);
    const params = { owner, repo };
    return cachedFetch<RepoTraffic>({
      userId,
      resource: "traffic",
      params,
      ttlSeconds: TTL.traffic,
      fetcher: async () => {
        const [viewsR, clonesR] = await Promise.allSettled([
          rest.repos.getViews({ ...params, per: "day" }),
          rest.repos.getClones({ ...params, per: "day" }),
        ]);
        const views =
          viewsR.status === "fulfilled"
            ? (viewsR.value.data as unknown as RepoTrafficViews)
            : null;
        const clones =
          clonesR.status === "fulfilled"
            ? (clonesR.value.data as unknown as RepoTrafficViews)
            : null;
        const restricted = views === null && clones === null;
        return {
          notModified: false as const,
          body: { views, clones, restricted },
        };
      },
    });
  },

  async listLanguages(userId: string, owner: string, repo: string) {
    const { rest } = await getGithubClients(userId);
    return cachedFetch<Record<string, number>>({
      userId,
      resource: "languages",
      params: { owner, repo },
      ttlSeconds: TTL.languages,
      fetcher: (etag) =>
        etagFetch(
          rest.repos.listLanguages as unknown as AnyEndpoint,
          { owner, repo },
          etag,
        ) as Promise<
          | { notModified: true }
          | {
              notModified: false;
              body: Record<string, number>;
              etag?: string;
            }
        >,
    });
  },

  async listIssues(
    userId: string,
    owner: string,
    repo: string,
    state: "open" | "closed" | "all" = "open",
    page = 1,
    perPage = 30,
  ) {
    const { rest } = await getGithubClients(userId);
    const params = { owner, repo, state, per_page: perPage, page };
    return cachedFetch<unknown[]>({
      userId,
      resource: "issues",
      params,
      ttlSeconds: TTL.issues,
      fetcher: (etag) =>
        etagFetch(
          rest.issues.listForRepo as unknown as AnyEndpoint,
          params,
          etag,
        ) as Promise<
          | { notModified: true }
          | { notModified: false; body: unknown[]; etag?: string }
        >,
    });
  },

  async listPullRequests(
    userId: string,
    owner: string,
    repo: string,
    state: "open" | "closed" | "all" = "open",
    page = 1,
    perPage = 30,
  ) {
    const { rest } = await getGithubClients(userId);
    const params = { owner, repo, state, per_page: perPage, page };
    return cachedFetch<unknown[]>({
      userId,
      resource: "prs",
      params,
      ttlSeconds: TTL.prs,
      fetcher: (etag) =>
        etagFetch(
          rest.pulls.list as unknown as AnyEndpoint,
          params,
          etag,
        ) as Promise<
          | { notModified: true }
          | { notModified: false; body: unknown[]; etag?: string }
        >,
    });
  },

  async listStars(
    userId: string,
    opts: {
      page?: number;
      perPage?: number;
      sort?: "created" | "updated";
      direction?: "asc" | "desc";
    } = {},
  ) {
    const { rest } = await getGithubClients(userId);
    const params = {
      per_page: opts.perPage ?? 30,
      page: opts.page ?? 1,
      sort: opts.sort ?? "created",
      direction: opts.direction ?? "desc",
    };
    return cachedFetch<unknown[]>({
      userId,
      resource: "stars",
      params,
      ttlSeconds: TTL.stars,
      fetcher: async (etag) => {
        try {
          const headers: Record<string, string> = {
            accept: "application/vnd.github.star+json",
          };
          if (etag) headers["If-None-Match"] = etag;
          const res = await rest.activity.listReposStarredByAuthenticatedUser({
            ...params,
            headers,
          });
          return {
            notModified: false as const,
            body: res.data as unknown as unknown[],
            etag: res.headers.etag,
          };
        } catch (err) {
          const e = err as { status?: number };
          if (e.status === 304) return { notModified: true as const };
          throw mapGithubError(err);
        }
      },
    });
  },

  async listPackages(
    userId: string,
    type:
      | "npm"
      | "container"
      | "maven"
      | "rubygems"
      | "nuget"
      | "docker" = "container",
    page = 1,
  ) {
    const { rest } = await getGithubClients(userId);
    const params = { package_type: type, per_page: 30, page };
    return cachedFetch<unknown[]>({
      userId,
      resource: "packages",
      params,
      ttlSeconds: TTL.packages,
      fetcher: (etag) =>
        etagFetch(
          rest.packages.listPackagesForAuthenticatedUser as unknown as AnyEndpoint,
          params,
          etag,
        ) as Promise<
          | { notModified: true }
          | { notModified: false; body: unknown[]; etag?: string }
        >,
    });
  },

  async listProjectsV2ForViewer(userId: string) {
    const { gql } = await getGithubClients(userId);
    type ProjectNode = {
      id: string;
      title: string;
      number: number;
      shortDescription: string | null;
      url: string;
      closed: boolean;
    };
    return cachedFetch<ProjectNode[]>({
      userId,
      resource: "projects",
      params: { kind: "viewer" },
      ttlSeconds: TTL.projects,
      fetcher: async () => {
        try {
          const data = await gql<{
            viewer: { projectsV2: { nodes: ProjectNode[] } };
          }>(`
            query {
              viewer {
                projectsV2(first: 50) {
                  nodes { id title number shortDescription url closed }
                }
              }
            }
          `);
          return {
            notModified: false as const,
            body: data.viewer.projectsV2.nodes,
          };
        } catch (err) {
          throw mapGithubError(err);
        }
      },
    });
  },

  /**
   * Aggregate overview metrics for the active context (user or org). Uses one
   * GraphQL round-trip so the dashboard can render quickly. Counts include
   * private repos for the authenticated user.
   */
  async getOverviewMetrics(
    userId: string,
    ctx: { kind: "user" | "org"; login: string },
  ) {
    const { gql } = await getGithubClients(userId);
    type ViewerOverview = {
      viewer: {
        login: string;
        repositories: { totalCount: number };
        starredRepositories: { totalCount: number };
        pullRequests: { totalCount: number };
        issues: { totalCount: number };
      };
    };
    type OrgOverview = {
      organization: {
        login: string;
        repositories: { totalCount: number };
      } | null;
    };
    type Overview = {
      kind: "user" | "org";
      login: string;
      repos: number;
      stars: number;
      openPRs: number;
      openIssues: number;
    };
    return cachedFetch<Overview>({
      userId,
      resource: "overview",
      params: ctx,
      ttlSeconds: TTL.viewer,
      fetcher: async () => {
        try {
          if (ctx.kind === "user") {
            const data = await gql<ViewerOverview>(`
              query {
                viewer {
                  login
                  repositories(ownerAffiliations: [OWNER], privacy: null) { totalCount }
                  starredRepositories { totalCount }
                  pullRequests(states: OPEN) { totalCount }
                  issues(states: OPEN) { totalCount }
                }
              }
            `);
            const body: Overview = {
              kind: "user",
              login: data.viewer.login,
              repos: data.viewer.repositories.totalCount,
              stars: data.viewer.starredRepositories.totalCount,
              openPRs: data.viewer.pullRequests.totalCount,
              openIssues: data.viewer.issues.totalCount,
            };
            return { notModified: false as const, body };
          }
          const data = await gql<OrgOverview>(
            `query($login:String!){
              organization(login:$login){
                login
                repositories(privacy: null){ totalCount }
              }
            }`,
            { login: ctx.login },
          );
          const body: Overview = {
            kind: "org",
            login: data.organization?.login ?? ctx.login,
            repos: data.organization?.repositories.totalCount ?? 0,
            stars: 0,
            openPRs: 0,
            openIssues: 0,
          };
          return { notModified: false as const, body };
        } catch (err) {
          throw mapGithubError(err);
        }
      },
    });
  },

  async createRepo(userId: string, input: CreateRepoInput) {
    const { rest } = await getGithubClients(userId);
    try {
      const res = await rest.repos.createForAuthenticatedUser({
        name: input.name,
        description: input.description,
        private: input.private ?? true,
        auto_init: input.autoInit ?? false,
        gitignore_template: input.gitignoreTemplate,
        license_template: input.licenseTemplate,
      });
      await invalidate(userId, "repos");
      return res.data;
    } catch (err) {
      throw mapGithubError(err);
    }
  },

  // ─── Issues ────────────────────────────────────────────────────────────────

  async getIssue(
    userId: string,
    owner: string,
    repo: string,
    issueNumber: number,
  ) {
    const { rest } = await getGithubClients(userId);
    const params = { owner, repo, issue_number: issueNumber };
    return cachedFetch<Issue>({
      userId,
      resource: "issue",
      params,
      ttlSeconds: TTL.issues,
      fetcher: (etag) =>
        etagFetch(
          rest.issues.get as unknown as AnyEndpoint,
          params,
          etag,
        ) as Promise<
          | { notModified: true }
          | { notModified: false; body: Issue; etag?: string }
        >,
    });
  },

  async listIssueComments(
    userId: string,
    owner: string,
    repo: string,
    issueNumber: number,
    page = 1,
  ) {
    const { rest } = await getGithubClients(userId);
    const params = { owner, repo, issue_number: issueNumber, per_page: 50, page };
    return cachedFetch<IssueComment[]>({
      userId,
      resource: "issue-comments",
      params,
      ttlSeconds: TTL.issues,
      fetcher: (etag) =>
        etagFetch(
          rest.issues.listComments as unknown as AnyEndpoint,
          params,
          etag,
        ) as Promise<
          | { notModified: true }
          | { notModified: false; body: IssueComment[]; etag?: string }
        >,
    });
  },

  async createIssueComment(
    userId: string,
    owner: string,
    repo: string,
    issueNumber: number,
    body: string,
  ) {
    const { rest } = await getGithubClients(userId);
    try {
      const res = await rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body,
      });
      await invalidate(userId, "issue-comments");
      await invalidate(userId, "issue");
      return res.data;
    } catch (err) {
      throw mapGithubError(err);
    }
  },

  async updateIssueState(
    userId: string,
    owner: string,
    repo: string,
    issueNumber: number,
    state: "open" | "closed",
  ) {
    const { rest } = await getGithubClients(userId);
    try {
      const res = await rest.issues.update({
        owner,
        repo,
        issue_number: issueNumber,
        state,
      });
      await invalidate(userId, "issue");
      await invalidate(userId, "issues");
      return res.data;
    } catch (err) {
      throw mapGithubError(err);
    }
  },

  async createIssue(
    userId: string,
    owner: string,
    repo: string,
    input: CreateIssueInput,
  ) {
    const { rest } = await getGithubClients(userId);
    try {
      const res = await rest.issues.create({
        owner,
        repo,
        title: input.title,
        body: input.body,
        labels: input.labels,
      });
      await invalidate(userId, "issues");
      return res.data as Issue;
    } catch (err) {
      throw mapGithubError(err);
    }
  },

  // ─── Pull Requests ──────────────────────────────────────────────────────────

  async getPullRequest(
    userId: string,
    owner: string,
    repo: string,
    pullNumber: number,
  ) {
    const { rest } = await getGithubClients(userId);
    const params = { owner, repo, pull_number: pullNumber };
    return cachedFetch<PullRequest>({
      userId,
      resource: "pr",
      params,
      ttlSeconds: TTL.prs,
      fetcher: (etag) =>
        etagFetch(
          rest.pulls.get as unknown as AnyEndpoint,
          params,
          etag,
        ) as Promise<
          | { notModified: true }
          | { notModified: false; body: PullRequest; etag?: string }
        >,
    });
  },

  async listPullRequestComments(
    userId: string,
    owner: string,
    repo: string,
    pullNumber: number,
    page = 1,
  ) {
    // Uses issues.listComments against the PR number (issue-style comments only;
    // review comments are out of scope for this phase).
    const { rest } = await getGithubClients(userId);
    const params = { owner, repo, issue_number: pullNumber, per_page: 50, page };
    return cachedFetch<IssueComment[]>({
      userId,
      resource: "pr-comments",
      params,
      ttlSeconds: TTL.prs,
      fetcher: (etag) =>
        etagFetch(
          rest.issues.listComments as unknown as AnyEndpoint,
          params,
          etag,
        ) as Promise<
          | { notModified: true }
          | { notModified: false; body: IssueComment[]; etag?: string }
        >,
    });
  },

  async updatePullRequestState(
    userId: string,
    owner: string,
    repo: string,
    pullNumber: number,
    state: "open" | "closed",
  ) {
    const { rest } = await getGithubClients(userId);
    try {
      const res = await rest.pulls.update({
        owner,
        repo,
        pull_number: pullNumber,
        state,
      });
      await invalidate(userId, "pr");
      await invalidate(userId, "prs");
      return res.data;
    } catch (err) {
      throw mapGithubError(err);
    }
  },

  // ─── Actions / Workflow Runs ──────────────────────────────────────────────

  /**
   * List workflows for a repo. Used to populate workflow filter dropdown.
   * GitHub returns { total_count, workflows } — we extract the array.
   */
  async listWorkflows(userId: string, owner: string, repo: string) {
    const { rest } = await getGithubClients(userId);
    const params = { owner, repo, per_page: 100 };
    // GitHub returns { total_count, workflows } wrapped in data
    const result = await cachedFetch<{ total_count: number; workflows: Workflow[] }>({
      userId,
      resource: "workflows",
      params: { owner, repo },
      ttlSeconds: 300,
      fetcher: (etag) =>
        etagFetch(
          rest.actions.listRepoWorkflows as unknown as AnyEndpoint,
          params,
          etag,
        ) as Promise<
          | { notModified: true }
          | {
              notModified: false;
              body: { total_count: number; workflows: Workflow[] };
              etag?: string;
            }
        >,
    });
    return result.data.workflows;
  },

  /**
   * List workflow runs for a repo with optional filters.
   * GitHub returns { total_count, workflow_runs } — we extract the array.
   */
  async listWorkflowRuns(
    userId: string,
    owner: string,
    repo: string,
    opts: ListWorkflowRunsOpts = {},
  ) {
    const { rest } = await getGithubClients(userId);
    const apiParams: Record<string, unknown> = {
      owner,
      repo,
      per_page: opts.perPage ?? 30,
      page: opts.page ?? 1,
    };
    if (opts.status && opts.status !== "all") apiParams.status = opts.status;
    if (opts.branch) apiParams.branch = opts.branch;

    const cacheParams = { owner, repo, ...apiParams };

    if (opts.workflowId) {
      // Use workflow-specific endpoint when filtering by workflow ID
      apiParams.workflow_id = opts.workflowId;
      const result = await cachedFetch<{
        total_count: number;
        workflow_runs: WorkflowRun[];
      }>({
        userId,
        resource: "workflow-runs",
        params: cacheParams,
        ttlSeconds: 30,
        fetcher: (etag) =>
          etagFetch(
            rest.actions.listWorkflowRuns as unknown as AnyEndpoint,
            apiParams,
            etag,
          ) as Promise<
            | { notModified: true }
            | {
                notModified: false;
                body: { total_count: number; workflow_runs: WorkflowRun[] };
                etag?: string;
              }
          >,
      });
      return result.data.workflow_runs;
    }

    const result = await cachedFetch<{
      total_count: number;
      workflow_runs: WorkflowRun[];
    }>({
      userId,
      resource: "workflow-runs",
      params: cacheParams,
      ttlSeconds: 30,
      fetcher: (etag) =>
        etagFetch(
          rest.actions.listWorkflowRunsForRepo as unknown as AnyEndpoint,
          apiParams,
          etag,
        ) as Promise<
          | { notModified: true }
          | {
              notModified: false;
              body: { total_count: number; workflow_runs: WorkflowRun[] };
              etag?: string;
            }
        >,
    });
    return result.data.workflow_runs;
  },

  async getWorkflowRun(
    userId: string,
    owner: string,
    repo: string,
    runId: number,
  ) {
    const { rest } = await getGithubClients(userId);
    const params = { owner, repo, run_id: runId };
    return cachedFetch<WorkflowRun>({
      userId,
      resource: "workflow-run",
      params,
      ttlSeconds: 60,
      fetcher: (etag) =>
        etagFetch(
          rest.actions.getWorkflowRun as unknown as AnyEndpoint,
          params,
          etag,
        ) as Promise<
          | { notModified: true }
          | { notModified: false; body: WorkflowRun; etag?: string }
        >,
    });
  },

  /**
   * List jobs for a workflow run.
   * GitHub returns { total_count, jobs } — we extract the array.
   */
  async listJobsForWorkflowRun(
    userId: string,
    owner: string,
    repo: string,
    runId: number,
  ) {
    const { rest } = await getGithubClients(userId);
    const params = { owner, repo, run_id: runId, per_page: 100 };
    const result = await cachedFetch<{
      total_count: number;
      jobs: WorkflowJob[];
    }>({
      userId,
      resource: "workflow-jobs",
      params: { owner, repo, run_id: runId },
      ttlSeconds: 30,
      fetcher: (etag) =>
        etagFetch(
          rest.actions.listJobsForWorkflowRun as unknown as AnyEndpoint,
          params,
          etag,
        ) as Promise<
          | { notModified: true }
          | {
              notModified: false;
              body: { total_count: number; jobs: WorkflowJob[] };
              etag?: string;
            }
        >,
    });
    return result.data.jobs;
  },

  /**
   * Re-run a workflow run, then invalidate runs cache.
   * Requires `workflow` scope — handled gracefully by mapGithubError.
   */
  async reRunWorkflow(
    userId: string,
    owner: string,
    repo: string,
    runId: number,
  ) {
    const { rest } = await getGithubClients(userId);
    try {
      await rest.actions.reRunWorkflow({ owner, repo, run_id: runId });
      await invalidate(userId, "workflow-runs");
      await invalidate(userId, "workflow-run");
    } catch (err) {
      throw mapGithubError(err);
    }
  },

  // ─── Activity Events ──────────────────────────────────────────────────────

  /**
   * Returns recent events for the authenticated user. Requires the viewer's
   * GitHub login (fetched separately to avoid a nested async in cachedFetch).
   * TTL: 60s. Resource key: "events".
   */
  async listViewerEvents(
    userId: string,
    perPage = 15,
    page = 1,
  ): Promise<{ data: ViewerEvent[] }> {
    const { rest } = await getGithubClients(userId);
    // We need the viewer's login to call listEventsForAuthenticatedUser.
    let login: string;
    try {
      const viewer = await this.getViewer(userId);
      login = viewer.data.login;
    } catch {
      return { data: [] };
    }
    return cachedFetch<ViewerEvent[]>({
      userId,
      resource: "events",
      params: { login, perPage, page },
      ttlSeconds: 60,
      fetcher: async (etag) => {
        try {
          const params: Record<string, unknown> = {
            username: login,
            per_page: perPage,
            page,
          };
          if (etag) params.headers = { "If-None-Match": etag };
          const res = await rest.activity.listEventsForAuthenticatedUser(
            params as Parameters<typeof rest.activity.listEventsForAuthenticatedUser>[0],
          );
          return {
            notModified: false as const,
            body: res.data as unknown as ViewerEvent[],
            etag: res.headers.etag,
          };
        } catch (err) {
          const e = err as { status?: number };
          if (e.status === 304) return { notModified: true as const };
          // Swallow errors (scope may be missing) and return empty list.
          return { notModified: false as const, body: [] };
        }
      },
    });
  },

  // ─── Notifications ────────────────────────────────────────────────────────

  /**
   * Lists GitHub notifications for the authenticated user. TTL: 30s.
   */
  async listNotifications(
    userId: string,
    opts: { all?: boolean } = {},
  ): Promise<{ data: GitHubNotification[] }> {
    const { rest } = await getGithubClients(userId);
    const params = { all: opts.all ?? false, per_page: 30 };
    return cachedFetch<GitHubNotification[]>({
      userId,
      resource: "notifications",
      params,
      ttlSeconds: 30,
      fetcher: async (etag) => {
        try {
          const reqParams: Record<string, unknown> = { ...params };
          if (etag) reqParams.headers = { "If-None-Match": etag };
          const res = await rest.activity.listNotificationsForAuthenticatedUser(
            reqParams as Parameters<typeof rest.activity.listNotificationsForAuthenticatedUser>[0],
          );
          return {
            notModified: false as const,
            body: res.data as unknown as GitHubNotification[],
            etag: res.headers.etag,
          };
        } catch (err) {
          const e = err as { status?: number };
          if (e.status === 304) return { notModified: true as const };
          // Notifications scope may be missing — return empty list gracefully.
          return { notModified: false as const, body: [] };
        }
      },
    });
  },

  /**
   * Marks a notification thread as read and invalidates notifications cache.
   */
  async markNotificationRead(userId: string, threadId: string): Promise<void> {
    const { rest } = await getGithubClients(userId);
    try {
      await rest.activity.markThreadAsRead({ thread_id: parseInt(threadId, 10) });
      await invalidate(userId, "notifications");
    } catch (err) {
      throw mapGithubError(err);
    }
  },

  /**
   * Marks all notifications as read up to current time. Invalidates cache.
   */
  async markAllNotificationsRead(userId: string): Promise<void> {
    const { rest } = await getGithubClients(userId);
    try {
      await rest.activity.markNotificationsAsRead({
        last_read_at: new Date().toISOString(),
      });
      await invalidate(userId, "notifications");
    } catch (err) {
      throw mapGithubError(err);
    }
  },

  // ─── Search (cross-repo issues/PRs) ─────────────────────────────────────────

  /**
   * Searches issues or pull requests across all repos accessible to the viewer.
   * Uses GitHub Search API. TTL: 60s. Resource key: "search-issues".
   */
  async searchIssuesAcrossRepos(
    userId: string,
    opts: SearchIssuesOpts,
  ): Promise<{ data: SearchIssuesResult }> {
    const { rest } = await getGithubClients(userId);
    const state = opts.state ?? "open";
    const scope = opts.scope ?? "author";
    const perPage = opts.perPage ?? 30;
    const page = opts.page ?? 1;

    const qParts: string[] = [
      `is:${opts.type}`,
      `state:${state}`,
      `${scope}:@me`,
      "archived:false",
    ];
    if (opts.org) qParts.push(`org:${opts.org}`);
    const q = qParts.join(" ");

    return cachedFetch<SearchIssuesResult>({
      userId,
      resource: "search-issues",
      params: { q, page, perPage },
      ttlSeconds: 60,
      fetcher: async (etag) => {
        try {
          const params: Record<string, unknown> = {
            q,
            per_page: perPage,
            page,
            sort: "updated",
            order: "desc",
          };
          if (etag) params.headers = { "If-None-Match": etag };
          const res = await rest.search.issuesAndPullRequests(
            params as Parameters<typeof rest.search.issuesAndPullRequests>[0],
          );
          return {
            notModified: false as const,
            body: res.data as unknown as SearchIssuesResult,
            etag: res.headers.etag,
          };
        } catch (err) {
          const e = err as { status?: number };
          if (e.status === 304) return { notModified: true as const };
          // graceful empty on rate-limit/forbidden
          if (e.status === 403 || e.status === 422) {
            return {
              notModified: false as const,
              body: { total_count: 0, incomplete_results: false, items: [] },
            };
          }
          throw mapGithubError(err);
        }
      },
    });
  },

  // ─── Contributions ────────────────────────────────────────────────────────

  /**
   * Returns flattened contribution days for the last ~4 weeks (28 entries) via
   * GraphQL contributionCalendar. TTL: 300s. Resource key: "contributions".
   */
  async getContributionsCalendar(userId: string): Promise<{ data: ContributionDay[] }> {
    const { gql } = await getGithubClients(userId);
    type CalendarResponse = {
      viewer: {
        contributionsCollection: {
          contributionCalendar: {
            totalContributions: number;
            weeks: Array<{
              contributionDays: Array<{ date: string; contributionCount: number }>;
            }>;
          };
        };
      };
    };
    return cachedFetch<ContributionDay[]>({
      userId,
      resource: "contributions",
      ttlSeconds: 300,
      fetcher: async () => {
        try {
          const data = await gql<CalendarResponse>(`
            query {
              viewer {
                contributionsCollection {
                  contributionCalendar {
                    totalContributions
                    weeks {
                      contributionDays {
                        date
                        contributionCount
                      }
                    }
                  }
                }
              }
            }
          `);
          const allDays = data.viewer.contributionsCollection.contributionCalendar.weeks
            .flatMap((w) =>
              w.contributionDays.map((d) => ({
                date: d.date,
                count: d.contributionCount,
              })),
            );
          // Return last 28 days
          const last28 = allDays.slice(-28);
          return { notModified: false as const, body: last28 };
        } catch (err) {
          throw mapGithubError(err);
        }
      },
    });
  },
};

export type GithubService = typeof githubService;
