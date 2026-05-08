import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { PaginationNav } from "@/components/pagination-nav";
import { MagicCard } from "@/components/ui/magic-card";
import { SyncStatusBadge } from "@/components/sync-status-badge";
import { DeviconStack } from "@/components/devicon-stack";
import { StarsFilters } from "./_components/stars-filters";
import { StarListRow } from "./_components/star-list-row";
import { clampPerPage } from "@/lib/pagination/per-page";
import {
  getUserPreferences,
  readViewMode,
} from "@/lib/preferences/get-user-preferences";

type StarRow = {
  starred_at: string;
  repo: {
    id: number;
    full_name: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    html_url: string;
    pushed_at?: string;
  };
};

type SortKey =
  | "created-desc"
  | "created-asc"
  | "updated-desc"
  | "stars-desc";

type SearchParams = {
  page?: string;
  perPage?: string;
  q?: string;
  language?: string;
  sort?: SortKey;
};

function parseSort(s?: string): {
  apiSort: "created" | "updated";
  apiDirection: "asc" | "desc";
  localSort: SortKey;
} {
  const v = (s as SortKey) ?? "created-desc";
  switch (v) {
    case "created-asc":
      return { apiSort: "created", apiDirection: "asc", localSort: v };
    case "updated-desc":
      return { apiSort: "updated", apiDirection: "desc", localSort: v };
    case "stars-desc":
      return { apiSort: "created", apiDirection: "desc", localSort: v };
    case "created-desc":
    default:
      return { apiSort: "created", apiDirection: "desc", localSort: v };
  }
}

const MAX_FETCH_PAGES_STARS = 5;
const FETCH_PAGE_SIZE_STARS = 100;

export default async function StarsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1"));
  const perPage = clampPerPage(sp.perPage);
  const { apiSort, apiDirection, localSort } = parseSort(sp.sort);
  const prefs = await getUserPreferences(session.user.id);
  const viewMode = readViewMode(prefs.filters, "stars");

  const q = sp.q?.toLowerCase().trim();
  const lang = sp.language?.trim();
  const hasLocalFilter = Boolean(q || lang);

  const all: StarRow[] = [];
  let exhausted = false;
  let oldestFetchedAt: number | undefined;
  let ttlSeconds: number | undefined;

  if (hasLocalFilter) {
    const needed = page * perPage + 1;
    for (let p = 1; p <= MAX_FETCH_PAGES_STARS; p++) {
      let batch: StarRow[] = [];
      try {
        const res = await githubService.listStars(session.user.id, {
          page: p,
          perPage: FETCH_PAGE_SIZE_STARS,
          sort: apiSort,
          direction: apiDirection,
        });
        batch = res.data as unknown as StarRow[];
        oldestFetchedAt =
          oldestFetchedAt === undefined
            ? res.fetchedAt
            : Math.min(oldestFetchedAt, res.fetchedAt);
        ttlSeconds = res.ttlSeconds;
      } catch {
        exhausted = true;
        break;
      }
      all.push(...batch);
      if (batch.length < FETCH_PAGE_SIZE_STARS) {
        exhausted = true;
        break;
      }
      const visibleSoFar = all.filter((s) => {
        if (q && !s.repo.full_name.toLowerCase().includes(q)) return false;
        if (lang && s.repo.language !== lang) return false;
        return true;
      });
      if (visibleSoFar.length >= needed) break;
    }
  } else {
    try {
      const res = await githubService.listStars(session.user.id, {
        page,
        perPage,
        sort: apiSort,
        direction: apiDirection,
      });
      all.push(...(res.data as unknown as StarRow[]));
      oldestFetchedAt = res.fetchedAt;
      ttlSeconds = res.ttlSeconds;
    } catch {
      // ignore
    }
  }

  let filtered = all.filter((s) => {
    if (q && !s.repo.full_name.toLowerCase().includes(q)) return false;
    if (lang && s.repo.language !== lang) return false;
    return true;
  });
  if (localSort === "stars-desc") {
    filtered = [...filtered].sort(
      (a, b) => b.repo.stargazers_count - a.repo.stargazers_count,
    );
  }

  // When local-filtering, we accumulated multiple raw pages into `all` and
  // need to slice locally. Otherwise we already fetched the right page.
  const slice = hasLocalFilter
    ? filtered.slice((page - 1) * perPage, (page - 1) * perPage + perPage)
    : filtered;
  const hasNext = hasLocalFilter
    ? filtered.length > page * perPage || !exhausted
    : all.length >= perPage;

  // Fetch language breakdown for the visible slice in parallel. Cached 1h
  // by the github cache layer, so repeat renders are free.
  const languagesByRepo = await Promise.all(
    slice.map(async (s) => {
      const [owner, name] = s.repo.full_name.split("/");
      try {
        const res = await githubService.getLanguages(
          session.user.id,
          owner,
          name,
        );
        return res.data;
      } catch {
        return s.repo.language ? { [s.repo.language]: 1 } : {};
      }
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Stars"
        description="Repositories you have starred."
        action={
          oldestFetchedAt !== undefined && ttlSeconds !== undefined ? (
            <SyncStatusBadge
              fetchedAt={oldestFetchedAt}
              ttlSeconds={ttlSeconds}
              path="/stars"
            />
          ) : undefined
        }
      />
      <StarsFilters viewMode={viewMode} />
      {slice.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No stars match"
          description="Adjust filters or star repos on GitHub to see them here."
        />
      ) : viewMode === "list" ? (
        <div className="flex flex-col gap-2">
          {slice.map((s, i) => (
            <StarListRow
              key={s.repo.id}
              fullName={s.repo.full_name}
              description={s.repo.description}
              language={s.repo.language}
              languages={languagesByRepo[i]}
              stars={s.repo.stargazers_count}
              htmlUrl={s.repo.html_url}
              starredAt={s.starred_at}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {slice.map((s, i) => (
            <Card
              key={s.repo.id}
              className="overflow-hidden border-none bg-transparent p-0 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
            >
            <MagicCard
              gradientFrom="var(--color-chart-1)"
              gradientTo="var(--color-chart-2)"
              gradientColor="color-mix(in oklch, var(--color-chart-1) 18%, transparent)"
              gradientSize={260}
              className="rounded-xl p-0"
            >
              <CardContent className="flex h-full flex-col gap-3 p-5">
                <a
                  href={s.repo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-sm font-semibold hover:underline"
                >
                  {s.repo.full_name}
                </a>
                <p className="line-clamp-2 min-h-10 text-xs text-muted-foreground">
                  {s.repo.description ?? ""}
                </p>
                <div className="mt-auto flex items-center gap-3 border-t pt-3 text-xs text-muted-foreground tabular-nums">
                  {(() => {
                    const langs = languagesByRepo[i];
                    const stack =
                      langs && Object.keys(langs).length > 0
                        ? langs
                        : s.repo.language
                          ? [s.repo.language]
                          : [];
                    return stack.length > 0 ? (
                      <DeviconStack languages={stack} max={2} size={14} />
                    ) : null;
                  })()}
                  <span className="flex items-center gap-1">
                    <Star className="size-3" />
                    {s.repo.stargazers_count}
                  </span>
                  <span className="ml-auto text-[11px]">
                    Starred {new Date(s.starred_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </MagicCard>
            </Card>
          ))}
        </div>
      )}
      <PaginationNav basePath="/stars" page={page} hasNext={hasNext} />
    </div>
  );
}
