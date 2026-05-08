import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GitBranch } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import {
  getUserPreferences,
  readViewMode,
} from "@/lib/preferences/get-user-preferences";
import { filterVisible } from "@/lib/preferences/visibility-filter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { PaginationNav } from "@/components/pagination-nav";
import { SyncStatusBadge } from "@/components/sync-status-badge";
import { RepoFilters } from "./_components/repo-filters";
import { RepoCard } from "./_components/repo-card";
import { RepoListRow } from "./_components/repo-list-row";
import { NewRepoDialog } from "./_components/new-repo-dialog";
import { PinnedRepos } from "./_components/pinned-repos";
import { clampPerPage } from "@/lib/pagination/per-page";

type SearchParams = {
  q?: string;
  language?: string;
  visibility?: "all" | "public" | "private";
  sort?: "created" | "updated" | "pushed" | "full_name";
  page?: string;
  perPage?: string;
};

export default async function RepositoriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const sp = await searchParams;
  const prefs = await getUserPreferences(session.user.id);
  const viewMode = readViewMode(prefs.filters, "repos");

  // Warm the first page of repos so the header can show sync status.
  // The Suspense'd <List> below re-uses the same cache entry instantly.
  let badgeFetchedAt: number | undefined;
  let badgeTtl: number | undefined;
  try {
    const sort = sp.sort ?? "updated";
    const visibility = sp.visibility ?? "all";
    const res = await githubService.listRepos(session.user.id, {
      sort,
      visibility,
      perPage: FETCH_PAGE_SIZE,
      page: 1,
    });
    badgeFetchedAt = res.fetchedAt;
    badgeTtl = res.ttlSeconds;
  } catch {
    // Best-effort — header just won't show the badge.
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Repositories"
        description="Filter, sort and open repositories you own or collaborate on."
        action={
          <div className="flex items-center gap-2">
            {badgeFetchedAt !== undefined && badgeTtl !== undefined ? (
              <SyncStatusBadge
                fetchedAt={badgeFetchedAt}
                ttlSeconds={badgeTtl}
                path="/repositories"
              />
            ) : null}
            <NewRepoDialog />
          </div>
        }
      />
      {prefs.pinnedRepos.length > 0 ? (
        <PinnedRepos pinned={prefs.pinnedRepos} userId={session.user.id} />
      ) : null}
      <RepoFilters viewMode={viewMode} />
      <Suspense fallback={<ListSkeleton viewMode={viewMode} />}>
        <List userId={session.user.id} sp={sp} viewMode={viewMode} />
      </Suspense>
    </div>
  );
}

// Max raw pages to scan (each page = 100 GitHub items). Caps API cost.
const MAX_FETCH_PAGES = 5;
const FETCH_PAGE_SIZE = 100;

async function List({
  userId,
  sp,
  viewMode,
}: {
  userId: string;
  sp: SearchParams;
  viewMode: "grid" | "list";
}) {
  const page = Math.max(1, Number(sp.page ?? "1"));
  const perPage = clampPerPage(sp.perPage);
  const prefs = await getUserPreferences(userId);
  const pinnedSet = new Set(prefs.pinnedRepos);

  const q = sp.q?.toLowerCase().trim();
  const lang = sp.language?.trim();
  const sort = sp.sort ?? "updated";
  const visibility = sp.visibility ?? "all";

  // Fetch GitHub pages until we have enough post-filter items for current page,
  // or we exhaust raw pages.
  const needed = page * perPage + 1;
  const all: Awaited<ReturnType<typeof githubService.listRepos>>["data"] = [];
  let exhausted = false;
  for (let p = 1; p <= MAX_FETCH_PAGES; p++) {
    let batch: typeof all = [];
    try {
      const res = await githubService.listRepos(userId, {
        sort,
        visibility,
        perPage: FETCH_PAGE_SIZE,
        page: p,
      });
      batch = res.data;
    } catch {
      exhausted = true;
      break;
    }
    all.push(...batch);
    if (batch.length < FETCH_PAGE_SIZE) {
      exhausted = true;
      break;
    }
    const visibleSoFar = filterVisible(all, prefs, pinnedSet).filter((r) => {
      if (pinnedSet.has(r.full_name)) return false;
      if (q && !r.full_name.toLowerCase().includes(q)) return false;
      if (lang && r.language !== lang) return false;
      return true;
    });
    if (visibleSoFar.length >= needed) break;
  }

  const filteredAll = filterVisible(all, prefs, pinnedSet).filter((r) => {
    if (pinnedSet.has(r.full_name)) return false;
    if (q && !r.full_name.toLowerCase().includes(q)) return false;
    if (lang && r.language !== lang) return false;
    return true;
  });

  const start = (page - 1) * perPage;
  const slice = filteredAll.slice(start, start + perPage);
  const hasNext = filteredAll.length > start + perPage || !exhausted;

  if (slice.length === 0) {
    return (
      <EmptyState
        icon={GitBranch}
        title="No repositories match"
        description="Try adjusting search, language or visibility filters."
      />
    );
  }

  // Fetch language breakdown for visible slice in parallel. Heavily cached
  // (TTL.languages = 1h) so repeat renders are free; failures fall back to
  // the repo's primary `language` field.
  const languagesByRepo = await Promise.all(
    slice.map(async (r) => {
      const [owner, name] = r.full_name.split("/");
      try {
        const res = await githubService.getLanguages(userId, owner, name);
        const data = res.data;
        // Empty languages map can happen for empty repos. If the repo has
        // a primary language reported by the listRepos call, fall back to
        // that single entry so the badge still renders.
        if (Object.keys(data).length === 0 && r.language) {
          return { [r.language]: 1 };
        }
        return data;
      } catch {
        return r.language ? { [r.language]: 1 } : {};
      }
    }),
  );

  return (
    <>
      {viewMode === "list" ? (
        <div className="flex flex-col gap-2">
          {slice.map((r, i) => (
            <RepoListRow
              key={r.id}
              fullName={r.full_name}
              description={r.description}
              language={r.language}
              languages={languagesByRepo[i]}
              stars={r.stargazers_count}
              forks={r.forks_count}
              openIssues={r.open_issues_count}
              isPrivate={r.private}
              pushedAt={r.pushed_at}
              pinned={pinnedSet.has(r.full_name)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {slice.map((r, i) => (
            <RepoCard
              key={r.id}
              fullName={r.full_name}
              description={r.description}
              language={r.language}
              languages={languagesByRepo[i]}
              stars={r.stargazers_count}
              forks={r.forks_count}
              openIssues={r.open_issues_count}
              isPrivate={r.private}
              pushedAt={r.pushed_at}
              pinned={pinnedSet.has(r.full_name)}
            />
          ))}
        </div>
      )}
      <PaginationNav basePath="/repositories" page={page} hasNext={hasNext} />
    </>
  );
}

function ListSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-md border bg-card/50 px-3 py-2.5 shadow-soft"
          >
            <Skeleton className="size-7 shrink-0 rounded-md" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-48 rounded" />
              <Skeleton className="h-3 w-3/4 rounded" />
            </div>
            <Skeleton className="hidden h-3 w-32 rounded sm:block" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-0">
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-7 rounded-md" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-3.5 w-32 rounded" />
                </div>
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-3/4 rounded" />
            <div className="mt-auto flex items-center gap-3 border-t pt-3">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
