import "server-only";
import { githubService } from "./service";
import { cachedFetch } from "./cache";
import type { ActionsUsageContext } from "./actions-billing-usage";
import {
  collectFailedRuns,
  summarizeRepoRuns,
  summarizeWorkflows,
  type FailedRun,
  type RepoActivityStat,
  type RunLike,
  type WorkflowActivityStat,
} from "./actions-activity-parse";

const MAX_REPOS = 15;
const MAX_PAGES = 2;
const PAGE_SIZE = 100;
const CONCURRENCY = 4;
const TTL_ACTIONS_ACTIVITY = 600; // 10 min

export type ActionsActivity = {
  repos: RepoActivityStat[];
  workflows: WorkflowActivityStat[];
  slowestWorkflows: WorkflowActivityStat[];
  failedRuns: FailedRun[];
  scannedRepos: number;
  truncated: boolean;
  fetchedAt: number;
};

export type ActionsActivityOpts = {
  year?: number;
  month?: number;
  /** Extra `owner/name` repos to include (typically from billing usage). */
  extraRepos?: string[];
};

type Candidate = { owner: string; name: string };

function monthBounds(
  year: number,
  month: number,
): { startIso: string; endIso: string; range: string } {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  // GitHub's `created` filter expects a date (or date range), not a
  // millisecond-precision timestamp — sending `.000Z` can 422. We request the
  // day range and still filter precisely on the ISO timestamps in code.
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    range: `${startDate}..${endDate}`,
  };
}

function parseExtraRepo(repo: string, fallbackOwner: string): Candidate | null {
  const trimmed = repo.trim();
  if (!trimmed) return null;
  if (trimmed.includes("/")) {
    const [owner, name] = trimmed.split("/", 2);
    if (owner && name) return { owner, name };
    return null;
  }
  return { owner: fallbackOwner, name: trimmed };
}

async function resolveCandidates(
  userId: string,
  ctx: ActionsUsageContext,
  extraRepos: string[],
): Promise<Candidate[]> {
  const seen = new Set<string>();
  const out: Candidate[] = [];
  const push = (c: Candidate | null) => {
    if (!c) return;
    const key = `${c.owner}/${c.name}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(c);
  };

  // Billing repos are known to have had usage, so prioritize them first.
  for (const repo of extraRepos) {
    push(parseExtraRepo(repo, ctx.login));
  }

  try {
    const res =
      ctx.kind === "user"
        ? await githubService.listRepos(userId, { sort: "pushed", perPage: 100 })
        : await githubService.listOrgRepos(userId, ctx.login, {
            sort: "pushed",
            perPage: 100,
          });
    for (const repo of res.data.filter((r) => !r.archived)) {
      push({ owner: repo.owner.login, name: repo.name });
      if (out.length >= MAX_REPOS) break;
    }
  } catch {
    // Listing may fail (rate limit / permissions); billing extras may still work.
  }

  // Hard cap: bounds the worst-case fan-out to MAX_REPOS × MAX_PAGES requests.
  return out.slice(0, MAX_REPOS);
}

async function fetchRepoRuns(
  userId: string,
  owner: string,
  name: string,
  range: string,
  startIso: string,
  endIso: string,
): Promise<{ runs: RunLike[]; truncated: boolean }> {
  const runs: RunLike[] = [];
  let truncated = false;

  for (let page = 1; page <= MAX_PAGES; page++) {
    let batch: RunLike[];
    try {
      batch = (await githubService.listWorkflowRuns(userId, owner, name, {
        perPage: PAGE_SIZE,
        page,
        created: range,
      })) as RunLike[];
    } catch {
      break;
    }
    // Defensive in-range filter: the `created` param is honored by GitHub but
    // we never trust the server to have applied it strictly. The upper bound
    // is exclusive, so a past month never leaks later-month runs.
    runs.push(
      ...batch.filter(
        (r) =>
          (r.created_at ?? "") >= startIso && (r.created_at ?? "") < endIso,
      ),
    );
    if (batch.length < PAGE_SIZE) break;
    if (page === MAX_PAGES) truncated = true;
  }

  return { runs, truncated };
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await fn(items[index]);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

function emptyActivity(): ActionsActivity {
  return {
    repos: [],
    workflows: [],
    slowestWorkflows: [],
    failedRuns: [],
    scannedRepos: 0,
    truncated: false,
    fetchedAt: Math.floor(Date.now() / 1000),
  };
}

/**
 * Aggregates workflow-run activity for the active context over one month.
 * Bounded work: top `MAX_REPOS` recently pushed repos × up to `MAX_PAGES`
 * pages, cached for 10 minutes. Never throws.
 */
export async function getActionsActivity(
  userId: string,
  ctx: ActionsUsageContext,
  opts: ActionsActivityOpts = {},
): Promise<ActionsActivity> {
  const now = new Date();
  const year = opts.year ?? now.getUTCFullYear();
  const month = opts.month ?? now.getUTCMonth() + 1;
  const { startIso, endIso, range } = monthBounds(year, month);

  const result = await cachedFetch<ActionsActivity>({
    userId,
    resource: "actions-activity",
    params: { ctx, year, month, extraRepos: opts.extraRepos ?? [] },
    ttlSeconds: TTL_ACTIONS_ACTIVITY,
    fetcher: async () => {
      try {
        const candidates = await resolveCandidates(
          userId,
          ctx,
          opts.extraRepos ?? [],
        );
        const perRepo = await mapLimit(candidates, CONCURRENCY, async (c) => {
          const { runs, truncated } = await fetchRepoRuns(
            userId,
            c.owner,
            c.name,
            range,
            startIso,
            endIso,
          );
          return { candidate: c, runs, truncated };
        });

        const repos: RepoActivityStat[] = [];
        const workflows: WorkflowActivityStat[] = [];
        const failedRuns: FailedRun[] = [];
        let truncated = false;

        for (const { candidate, runs, truncated: repoTruncated } of perRepo) {
          const fullName = `${candidate.owner}/${candidate.name}`;
          repos.push(
            summarizeRepoRuns(candidate.owner, candidate.name, runs, {
              truncated: repoTruncated,
            }),
          );
          workflows.push(...summarizeWorkflows(fullName, runs));
          failedRuns.push(...collectFailedRuns(fullName, runs, 10));
          truncated = truncated || repoTruncated;
        }

        const withDuration = workflows.filter(
          (w) => w.avgDurationSeconds != null,
        );
        const body: ActionsActivity = {
          repos: repos.sort((a, b) => b.runs - a.runs),
          workflows: workflows
            .sort((a, b) => b.failures - a.failures)
            .slice(0, 10),
          slowestWorkflows: withDuration
            .sort(
              (a, b) =>
                (b.avgDurationSeconds ?? 0) - (a.avgDurationSeconds ?? 0),
            )
            .slice(0, 10),
          failedRuns: failedRuns
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .slice(0, 10),
          scannedRepos: candidates.length,
          truncated,
          fetchedAt: Math.floor(Date.now() / 1000),
        };
        return { notModified: false as const, body };
      } catch {
        return { notModified: false as const, body: emptyActivity() };
      }
    },
  });

  return result.data;
}
