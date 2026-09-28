import "server-only";
import { hasGithubScope } from "@/lib/auth/github-scope-check";
import { getGithubClients } from "./client";
import { cachedFetch } from "./cache";
import { includedMinutesForPlan } from "./actions-included-minutes";
import {
  aggregateActionsUsage,
  classifyBillingError,
  type ActionsUsageStatus,
  type AggregatedActionsUsage,
  type BillingUsageResponse,
} from "./actions-billing-parse";

export type ActionsUsageContext = { kind: "user" | "org"; login: string };

export type ActionsUsage = AggregatedActionsUsage & {
  status: ActionsUsageStatus;
  includedMinutes: number | null;
  plan: string | null;
  contextKind: "user" | "org";
  contextLogin: string;
  year: number;
  month: number;
  /** `YYYY-MM` label for display. */
  periodLabel: string;
  fetchedAt: number;
};

const TTL_ACTIONS_BILLING = 900; // 15 min
const TTL_ACCOUNT_PLAN = 3600;

type OctokitResponse = {
  data: unknown;
  headers: Record<string, string | undefined>;
};
type GenericRequest = (
  route: string,
  params?: Record<string, unknown>,
) => Promise<OctokitResponse>;

const EMPTY_AGGREGATE: AggregatedActionsUsage = {
  usedMinutes: 0,
  netAmount: 0,
  byOs: [],
  byRepo: [],
  byDay: [],
};

async function fetchPlanName(
  userId: string,
  ctx: ActionsUsageContext,
): Promise<string | null> {
  try {
    const { rest } = await getGithubClients(userId);
    const request = rest.request as unknown as GenericRequest;
    const route =
      ctx.kind === "user" ? "GET /user" : "GET /orgs/{org}";
    const params = ctx.kind === "user" ? {} : { org: ctx.login };

    const result = await cachedFetch<{ plan?: { name?: string } | null }>({
      userId,
      resource: "actions-plan",
      params: { ctx },
      ttlSeconds: TTL_ACCOUNT_PLAN,
      fetcher: async (etag) => {
        try {
          const res = await request(route, {
            ...params,
            ...(etag ? { headers: { "If-None-Match": etag } } : {}),
          });
          return {
            notModified: false as const,
            body: res.data as { plan?: { name?: string } | null },
            etag: res.headers.etag,
          };
        } catch (err) {
          if ((err as { status?: number })?.status === 304) {
            return { notModified: true as const };
          }
          throw err;
        }
      },
    });
    return result.data?.plan?.name ?? null;
  } catch {
    // Plan is a nice-to-have; usage still renders without a denominator.
    return null;
  }
}

/**
 * Fetches and aggregates the current-cycle Actions usage for the active
 * context (personal account or org). Never throws — returns a `status` the UI
 * can render. Personal accounts require the `user` OAuth scope; org usage
 * requires the caller to be an owner/billing manager.
 */
export async function getActionsUsage(
  userId: string,
  ctx: ActionsUsageContext,
  opts: { year?: number; month?: number } = {},
): Promise<ActionsUsage> {
  const now = new Date();
  const year = opts.year ?? now.getUTCFullYear();
  const month = opts.month ?? now.getUTCMonth() + 1;

  const base: ActionsUsage = {
    ...EMPTY_AGGREGATE,
    status: "unavailable",
    includedMinutes: null,
    plan: null,
    contextKind: ctx.kind,
    contextLogin: ctx.login,
    year,
    month,
    periodLabel: `${year}-${String(month).padStart(2, "0")}`,
    fetchedAt: Math.floor(Date.now() / 1000),
  };

  if (ctx.kind === "user" && !(await hasGithubScope(userId, "user"))) {
    return { ...base, status: "missing_scope" };
  }

  try {
    const { rest } = await getGithubClients(userId);
    const request = rest.request as unknown as GenericRequest;
    const route =
      ctx.kind === "user"
        ? "GET /users/{username}/settings/billing/usage"
        : "GET /organizations/{org}/settings/billing/usage";
    const params =
      ctx.kind === "user"
        ? { username: ctx.login, year, month }
        : { org: ctx.login, year, month };

    const result = await cachedFetch<BillingUsageResponse>({
      userId,
      resource: "actions-billing",
      params: { ctx, year, month },
      ttlSeconds: TTL_ACTIONS_BILLING,
      fetcher: async (etag) => {
        try {
          const res = await request(route, {
            ...params,
            ...(etag ? { headers: { "If-None-Match": etag } } : {}),
          });
          return {
            notModified: false as const,
            body: res.data as BillingUsageResponse,
            etag: res.headers.etag,
          };
        } catch (err) {
          if ((err as { status?: number })?.status === 304) {
            return { notModified: true as const };
          }
          throw err;
        }
      },
    });

    const aggregate = aggregateActionsUsage(result.data?.usageItems ?? []);
    const plan = await fetchPlanName(userId, ctx);
    return {
      ...base,
      ...aggregate,
      status: "ok",
      plan,
      includedMinutes: includedMinutesForPlan(plan),
    };
  } catch (err) {
    return { ...base, status: classifyBillingError(err, ctx.kind) };
  }
}
