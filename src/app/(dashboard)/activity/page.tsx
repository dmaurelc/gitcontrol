import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth/auth";
import { PageHeader } from "@/components/page-header";
import { ActivityFeed } from "@/components/activity-feed";
import { PaginationNav } from "@/components/pagination-nav";
import { PerPageSelect } from "@/components/per-page-select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { clampPerPage } from "@/lib/pagination/per-page";

type SearchParams = { page?: string; perPage?: string };

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");
  const sp = await searchParams;
  const perPage = clampPerPage(sp.perPage);
  // GitHub events API caps at 300 events total (10 pages × 30). With dynamic
  // per_page we keep the same hard ceiling: floor(300 / perPage).
  const maxPages = Math.max(1, Math.floor(300 / perPage));
  const page = Math.max(1, Math.min(maxPages, parseInt(sp.page ?? "1", 10) || 1));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Activity"
        description="Recent GitHub events for your account"
      />
      <div className="flex items-center justify-end">
        <PerPageSelect basePath="/activity" />
      </div>
      <Card className="shadow-card">
        <CardContent className="px-4 py-2">
          <Suspense key={`${page}-${perPage}`} fallback={<ListSkeleton count={perPage} />}>
            <ActivityFeed
              userId={session.user.id}
              limit={perPage}
              page={page}
            />
          </Suspense>
        </CardContent>
      </Card>
      <PaginationNav basePath="/activity" page={page} hasNext={page < maxPages} />
    </div>
  );
}

function ListSkeleton({ count }: { count: number }) {
  return (
    <ul className="flex flex-col">
      {Array.from({ length: Math.min(count, 12) }).map((_, i) => (
        <li
          key={i}
          className="flex items-start gap-2.5 py-2.5 border-b border-border/50 last:border-none"
        >
          <Skeleton className="mt-0.5 size-6 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        </li>
      ))}
    </ul>
  );
}
