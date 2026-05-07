import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { getUserPreferences } from "@/lib/preferences/get-user-preferences";
import { filterVisible } from "@/lib/preferences/visibility-filter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RepoFilters } from "./_components/repo-filters";
import { RepoCard } from "./_components/repo-card";
import { NewRepoDialog } from "./_components/new-repo-dialog";
import { PinnedRepos } from "./_components/pinned-repos";
import { PerPageSelect } from "@/components/per-page-select";
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Repositories</h1>
          <p className="text-sm text-muted-foreground">
            Filter, sort and open repositories you own or collaborate on.
          </p>
        </div>
        <NewRepoDialog />
      </div>
      {prefs.pinnedRepos.length > 0 ? (
        <PinnedRepos pinned={prefs.pinnedRepos} userId={session.user.id} />
      ) : null}
      <RepoFilters />
      <div className="flex items-center justify-end">
        <PerPageSelect basePath="/repositories" />
      </div>
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
      <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
        No repositories match the current filters.
      </div>
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
      <Pagination page={page} hasNext={hasNext} sp={sp} />
    </>
  );
}

function Pagination({
  page,
  hasNext,
  sp,
}: {
  page: number;
  hasNext: boolean;
  sp: SearchParams;
}) {
  function pageHref(p: number) {
    const next = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => {
      if (v && k !== "page") next.set(k, String(v));
    });
    next.set("page", String(p));
    return `/repositories?${next.toString()}`;
  }
  return (
    <div className="flex items-center justify-end gap-2">
      <Button asChild variant="outline" size="sm" disabled={page <= 1}>
        <Link href={pageHref(Math.max(1, page - 1))}>Previous</Link>
      </Button>
      <span className="text-sm text-muted-foreground">Page {page}</span>
      <Button asChild variant="outline" size="sm" disabled={!hasNext}>
        <Link href={pageHref(page + 1)}>Next</Link>
      </Button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-xl" />
      ))}
    </div>
  );
}
