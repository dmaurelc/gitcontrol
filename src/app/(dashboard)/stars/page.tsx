import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Star } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getLanguageColor } from "@/lib/github/language-colors";
import { StarsFilters } from "./_components/stars-filters";
import { PerPageSelect } from "@/components/per-page-select";
import { clampPerPage } from "@/lib/pagination/per-page";

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

  const q = sp.q?.toLowerCase().trim();
  const lang = sp.language?.trim();
  const hasLocalFilter = Boolean(q || lang);

  const all: StarRow[] = [];
  let exhausted = false;

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

  function pageHref(p: number) {
    const next = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => {
      if (v && k !== "page") next.set(k, String(v));
    });
    next.set("page", String(p));
    return `/stars?${next.toString()}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Stars" description="Repositories you have starred." />
      <StarsFilters />
      <div className="flex items-center justify-end">
        <PerPageSelect basePath="/stars" />
      </div>
      {slice.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No stars match"
          description="Adjust filters or star repos on GitHub to see them here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {slice.map((s) => (
            <Card
              key={s.repo.id}
              className="p-0 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
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
                  {s.repo.language ? (
                    <span className="flex items-center gap-1.5">
                      <span
                        className="size-2.5 rounded-full ring-1 ring-border"
                        style={{
                          backgroundColor: getLanguageColor(s.repo.language),
                        }}
                      />
                      <span className="text-foreground/80">
                        {s.repo.language}
                      </span>
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1">
                    <Star className="size-3" />
                    {s.repo.stargazers_count}
                  </span>
                  <span className="ml-auto text-[11px]">
                    Starred {new Date(s.starred_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button asChild variant="outline" size="sm" disabled={page <= 1}>
          <Link href={pageHref(Math.max(1, page - 1))}>Previous</Link>
        </Button>
        <span className="text-xs text-muted-foreground">Page {page}</span>
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={!hasNext}
        >
          <Link href={pageHref(page + 1)}>Next</Link>
        </Button>
      </div>
    </div>
  );
}
