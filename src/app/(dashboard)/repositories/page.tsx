import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GitBranch } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { getUserPreferences } from "@/lib/preferences/get-user-preferences";
import { filterVisible } from "@/lib/preferences/visibility-filter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { PaginationNav } from "@/components/pagination-nav";
import { RepoFilters } from "./_components/repo-filters";
import { RepoCard } from "./_components/repo-card";
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Repositories"
        description="Filter, sort and open repositories you own or collaborate on."
        action={<NewRepoDialog />}
      />
      {prefs.pinnedRepos.length > 0 ? (
        <PinnedRepos pinned={prefs.pinnedRepos} userId={session.user.id} />
      ) : null}
      <RepoFilters />
      <Suspense fallback={<ListSkeleton />}>
        <List userId={session.user.id} sp={sp} />
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
}: {
  userId: string;
  sp: SearchParams;
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
      if (q && !r.full_name.toLowerCase().includes(q)) return false;
      if (lang && r.language !== lang) return false;
      return true;
    });
    if (visibleSoFar.length >= needed) break;
  }

  const filteredAll = filterVisible(all, prefs, pinnedSet).filter((r) => {
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

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {slice.map((r) => (
          <RepoCard
            key={r.id}
            fullName={r.full_name}
            description={r.description}
            language={r.language}
            stars={r.stargazers_count}
            forks={r.forks_count}
            openIssues={r.open_issues_count}
            isPrivate={r.private}
            pushedAt={r.pushed_at}
            pinned={pinnedSet.has(r.full_name)}
          />
        ))}
      </div>
      <PaginationNav basePath="/repositories" page={page} hasNext={hasNext} />
    </>
  );
}

function ListSkeleton() {
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
