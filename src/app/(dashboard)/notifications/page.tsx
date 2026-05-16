import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationsList } from "./_components/notifications-list";
import type { GitHubNotification } from "@/lib/github/service";

type SearchParams = { showRead?: string };

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");
  const sp = await searchParams;
  const showRead = sp.showRead === "1";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description="Latest notifications from GitHub"
      />
      <Suspense key={String(showRead)} fallback={<ListSkeleton />}>
        <NotificationsLoader userId={session.user.id} showRead={showRead} />
      </Suspense>
    </div>
  );
}

async function NotificationsLoader({
  userId,
  showRead,
}: {
  userId: string;
  showRead: boolean;
}) {
  let notifications: GitHubNotification[] = [];
  try {
    const res = await githubService.listNotifications(userId, { all: showRead });
    notifications = res.data;
  } catch {}
  return <NotificationsList initial={notifications} showRead={showRead} />;
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-28 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
      <Card className="shadow-card">
        <CardContent className="p-0">
          <ul className="divide-y divide-border/60">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="size-2 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
