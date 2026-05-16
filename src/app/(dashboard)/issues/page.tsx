import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { getActiveContext } from "@/lib/context/active-context";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { PaginationNav } from "@/components/pagination-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IssueRow } from "@/components/issue-row";
import { cn } from "@/lib/utils";

type SearchParams = {
  state?: "open" | "closed";
  scope?: "author" | "assignee" | "mentions";
  page?: string;
};

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");
  const sp = await searchParams;
  const state = sp.state ?? "open";
  const scope = sp.scope ?? "author";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Issues" description="Across all your repositories" />
      <FilterBar basePath="/issues" state={state} scope={scope} />
      <Suspense fallback={<ListSkeleton />}>
        <IssuesList
          userId={session.user.id}
          fallbackLogin={session.user.email}
          state={state}
          scope={scope}
          page={page}
        />
      </Suspense>
    </div>
  );
}

async function IssuesList({
  userId,
  fallbackLogin,
  state,
  scope,
  page,
}: {
  userId: string;
  fallbackLogin: string;
  state: "open" | "closed";
  scope: "author" | "assignee" | "mentions";
  page: number;
}) {
  let viewerLogin = fallbackLogin;
  try {
    const v = await githubService.getViewer(userId);
    viewerLogin = v.data.login;
  } catch {}
  const ctx = await getActiveContext(userId, viewerLogin);
  const org = ctx.kind === "org" ? ctx.login : undefined;

  let total = 0;
  let items: Array<Awaited<ReturnType<typeof githubService.searchIssuesAcrossRepos>>["data"]["items"][number]> = [];
  try {
    const res = await githubService.searchIssuesAcrossRepos(userId, {
      type: "issue",
      state,
      scope,
      org,
      page,
      perPage: 30,
    });
    items = res.data.items;
    total = res.data.total_count;
  } catch {}

  if (items.length === 0) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="No issues"
        description={`No ${state} issues match the current filter.`}
      />
    );
  }

  const hasNext = items.length === 30 && page * 30 < total;

  return (
    <>
      <Card className="shadow-card">
        <CardContent className="p-0">
          <ul className="divide-y divide-border/60">
            {items.map((it) => (
              <li key={it.id}>
                <IssueRow item={it} kind="issue" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <PaginationNav basePath="/issues" page={page} hasNext={hasNext} />
    </>
  );
}

function FilterBar({
  basePath,
  state,
  scope,
}: {
  basePath: string;
  state: "open" | "closed";
  scope: "author" | "assignee" | "mentions";
}) {
  const states: Array<{ k: "open" | "closed"; label: string }> = [
    { k: "open", label: "Open" },
    { k: "closed", label: "Closed" },
  ];
  const scopes: Array<{ k: "author" | "assignee" | "mentions"; label: string }> = [
    { k: "author", label: "Created by me" },
    { k: "assignee", label: "Assigned" },
    { k: "mentions", label: "Mentioned" },
  ];
  const linkFor = (next: Partial<{ state: string; scope: string }>) => {
    const params = new URLSearchParams();
    const s = next.state ?? state;
    const sc = next.scope ?? scope;
    if (s !== "open") params.set("state", s);
    if (sc !== "author") params.set("scope", sc);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-md border bg-background p-1">
        {states.map((s) => (
          <Link
            key={s.k}
            href={linkFor({ state: s.k })}
            className={cn(
              "rounded px-3 py-1 text-xs font-medium transition-colors",
              s.k === state
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-1 rounded-md border bg-background p-1">
        {scopes.map((s) => (
          <Link
            key={s.k}
            href={linkFor({ scope: s.k })}
            className={cn(
              "rounded px-3 py-1 text-xs font-medium transition-colors",
              s.k === scope
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <Card className="shadow-card">
      <CardContent className="p-0">
        <ul className="divide-y divide-border/60">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="size-4 shrink-0 rounded" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
              <Skeleton className="h-3 w-12 rounded" />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
