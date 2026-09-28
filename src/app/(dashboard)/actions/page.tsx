import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { getActiveContext } from "@/lib/context/active-context";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getActionsUsage } from "@/lib/github/actions-billing-usage";
import { ActionsUsageSection } from "./_components/actions-usage-section";
import { ActionsActivitySection } from "./_components/actions-activity-section";

type SP = { month?: string | string[] };

/** How many months back the selector may go (bounds the billing fan-out). */
const MONTH_WINDOW = 12;

function parseMonthParam(
  raw: string | string[] | undefined,
  now: Date,
): { year: number; month: number } | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12 || year < 2008) return null;
  const index = year * 12 + (month - 1);
  const nowIndex = now.getUTCFullYear() * 12 + now.getUTCMonth();
  if (index > nowIndex || index < nowIndex - (MONTH_WINDOW - 1)) return null;
  return { year, month };
}

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function ActionsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  const sp = await searchParams;
  const now = new Date();
  const parsed =
    parseMonthParam(sp.month, now) ?? {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
    };

  let viewerLogin = session.user.email;
  try {
    const v = await githubService.getViewer(session.user.id);
    viewerLogin = v.data.login;
  } catch {
    // fall through
  }
  const ctx = await getActiveContext(session.user.id, viewerLogin);
  // Fetched once here and shared with both sections to avoid a duplicate
  // billing call on a cold cache.
  const usage = await getActionsUsage(session.user.id, ctx, {
    year: parsed.year,
    month: parsed.month,
  });

  const prev = shiftMonth(parsed.year, parsed.month, -1);
  const next = shiftMonth(parsed.year, parsed.month, 1);
  const current = { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  const isCurrent =
    parsed.year === current.year && parsed.month === current.month;
  const nextIsFuture =
    next.year > current.year ||
    (next.year === current.year && next.month > current.month);

  const href = (m: { year: number; month: number }) =>
    `/actions?month=${m.year}-${String(m.month).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Actions usage"
        description={`${ctx.login} · ${monthLabel(parsed.year, parsed.month)}`}
        action={
          <div className="flex items-center gap-1">
            <Link
              href={href(prev)}
              aria-label="Previous month"
              className="grid size-8 place-items-center rounded-md border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </Link>
            {!isCurrent ? (
              <Link
                href="/actions"
                className="rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                Current
              </Link>
            ) : null}
            {!nextIsFuture ? (
              <Link
                href={href(next)}
                aria-label="Next month"
                className="grid size-8 place-items-center rounded-md border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ChevronRight className="size-4" />
              </Link>
            ) : null}
          </div>
        }
      />

      <ActionsUsageSection usage={usage} />

      <Suspense fallback={<ActivitySkeleton />}>
        <ActionsActivitySection userId={session.user.id} ctx={ctx} usage={usage} />
      </Suspense>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48 rounded" />
          <Skeleton className="mt-2 h-3 w-56 rounded" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full rounded" />
          ))}
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40 rounded" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-6 w-full rounded" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
