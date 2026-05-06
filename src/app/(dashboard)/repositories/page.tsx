import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { getUserPreferences } from "@/lib/preferences/get-user-preferences";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RepoFilters } from "./_components/repo-filters";
import { RepoCard } from "./_components/repo-card";
import { NewRepoDialog } from "./_components/new-repo-dialog";
import { PinnedRepos } from "./_components/pinned-repos";

type SearchParams = {
  q?: string;
  language?: string;
  visibility?: "all" | "public" | "private";
  sort?: "created" | "updated" | "pushed" | "full_name";
  page?: string;
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
      <Suspense fallback={<ListSkeleton />}>
        <List userId={session.user.id} sp={sp} />
      </Suspense>
    </div>
  );
}

async function List({
  userId,
  sp,
}: {
  userId: string;
  sp: SearchParams;
}) {
  const page = Math.max(1, Number(sp.page ?? "1"));
  let repos: Awaited<ReturnType<typeof githubService.listRepos>>["data"] = [];
  try {
    const res = await githubService.listRepos(userId, {
      sort: sp.sort ?? "updated",
      visibility: sp.visibility ?? "all",
      perPage: 30,
      page,
    });
    repos = res.data;
  } catch {
    // ignore — show empty state
  }
  const prefs = await getUserPreferences(userId);
  const pinnedSet = new Set(prefs.pinnedRepos);

  // Local filtering for fields GitHub list endpoint doesn't natively filter on
  const q = sp.q?.toLowerCase().trim();
  const lang = sp.language?.trim();
  const filtered = repos.filter((r) => {
    if (q && !r.full_name.toLowerCase().includes(q)) return false;
    if (lang && r.language !== lang) return false;
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
        No repositories match the current filters.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((r) => (
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
      <Pagination page={page} hasNext={repos.length === 30} sp={sp} />
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
