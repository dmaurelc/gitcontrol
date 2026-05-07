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
  ) {
    const { rest } = await getGithubClients(userId);
    const params = { owner, repo, state, per_page: 30, page };
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
  ) {
    const { rest } = await getGithubClients(userId);
    const params = { owner, repo, state, per_page: 30, page };
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
};

export type GithubService = typeof githubService;
