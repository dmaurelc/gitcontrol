import Link from "next/link";
import { Activity, ArrowUpRight } from "lucide-react";
import { githubService } from "@/lib/github/service";
import { getActiveContext } from "@/lib/context/active-context";
import {
  getActionsUsage,
  type ActionsUsage,
} from "@/lib/github/actions-billing-usage";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GrantGithubScopeButton } from "@/components/grant-github-scope-button";
import { cn } from "@/lib/utils";

type ActionsUsageCardProps = {
  userId: string;
  fallbackLogin: string;
};

/**
 * Server component: resolves the active context, then renders the current
 * month's Actions usage. Never throws — billing failures degrade to messages.
 */
export async function ActionsUsageCard({
  userId,
  fallbackLogin,
}: ActionsUsageCardProps) {
  let viewerLogin = fallbackLogin;
  try {
    const v = await githubService.getViewer(userId);
    viewerLogin = v.data.login;
  } catch {
    // fall through to the session-provided login
  }
  const ctx = await getActiveContext(userId, viewerLogin);
  const usage = await getActionsUsage(userId, ctx);
  return <ActionsUsageView usage={usage} />;
}

function barColor(percent: number): string {
  if (percent >= 90) return "bg-destructive";
  if (percent >= 70) return "bg-amber-500";
  return "bg-chart-1";
}

function ActionsUsageView({ usage }: { usage: ActionsUsage }) {
  const header = (
    <CardHeader className="flex flex-row items-center justify-between gap-2">
      <div className="space-y-0.5">
        <CardTitle className="text-base">Actions usage</CardTitle>
        <p className="text-xs text-muted-foreground">
          {usage.contextLogin} · {usage.periodLabel}
        </p>
      </div>
      <Activity className="size-4 text-muted-foreground" />
    </CardHeader>
  );

  if (usage.status === "missing_scope") {
    return (
      <Card className="h-full shadow-card">
        {header}
        <CardContent className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">
            Grant read access to your GitHub billing to see Actions minutes for
            this month.
          </p>
          <GrantGithubScopeButton label="Grant billing access" />
        </CardContent>
      </Card>
    );
  }

  if (usage.status === "forbidden_org") {
    return (
      <Card className="h-full shadow-card">
        {header}
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You need owner or billing-manager access in this organization to see
            its Actions usage.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (usage.status === "unavailable") {
    return (
      <Card className="h-full shadow-card">
        {header}
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Actions billing data is not available for this context right now.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { usedMinutes, includedMinutes, byOs } = usage;
  const percent =
    includedMinutes && includedMinutes > 0
      ? Math.min(100, (usedMinutes / includedMinutes) * 100)
      : null;

  return (
    <Card className="h-full shadow-card">
      {header}
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight tabular-nums">
            {usedMinutes.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {includedMinutes != null
              ? `/ ${includedMinutes.toLocaleString()} min`
              : "min used"}
          </span>
        </div>

        {percent != null ? (
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={Math.round(percent)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn("h-full rounded-full transition-all", barColor(percent))}
              style={{ width: `${Math.max(percent, usedMinutes > 0 ? 2 : 0)}%` }}
            />
          </div>
        ) : null}

        {byOs.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {byOs.map((os) => (
              <span
                key={os.os}
                className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
              >
                <span className="font-medium text-foreground tabular-nums">
                  {os.minutes.toLocaleString()}
                </span>
                {os.os}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No billable Actions minutes this month.
          </p>
        )}

        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground/80">
            Runner-minutes · private repos
          </p>
          <Link
            href="/actions"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View details <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function ActionsUsageCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-muted" />
          <div className="h-3 w-40 rounded bg-muted" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="h-8 w-40 rounded bg-muted" />
        <div className="h-2 w-full rounded-full bg-muted" />
        <div className="h-6 w-56 rounded bg-muted" />
      </CardContent>
    </Card>
  );
}
