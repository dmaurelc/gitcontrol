import { Activity, Clock, CircleAlert, DollarSign } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { GrantGithubScopeButton } from "@/components/grant-github-scope-button";
import type { ActionsUsage } from "@/lib/github/actions-billing-usage";
import { ActionsUsageTrendChart } from "./actions-usage-trend-chart";

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card/40 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function UsageUnavailable({ usage }: { usage: ActionsUsage }) {
  if (usage.status === "missing_scope") {
    return (
      <EmptyState
        icon={Activity}
        title="Billing access needed"
        description="Grant read access to your GitHub billing to see Actions minutes."
        action={<GrantGithubScopeButton label="Grant billing access" />}
      />
    );
  }
  return (
    <EmptyState
      icon={CircleAlert}
      title="Actions usage unavailable"
      description={
        usage.status === "forbidden_org"
          ? "You need owner or billing-manager access in this organization to see its Actions usage."
          : "GitHub did not return billing data for this context."
      }
    />
  );
}

export function ActionsUsageSection({ usage }: { usage: ActionsUsage }) {
  if (usage.status !== "ok") {
    return <UsageUnavailable usage={usage} />;
  }

  const now = new Date();
  const daysInMonth = new Date(Date.UTC(usage.year, usage.month, 0)).getUTCDate();
  const isCurrentMonth =
    usage.year === now.getUTCFullYear() && usage.month === now.getUTCMonth() + 1;
  const dayOfMonth = isCurrentMonth ? now.getUTCDate() : daysInMonth;
  const daysRemaining = Math.max(0, daysInMonth - dayOfMonth);
  const projection =
    isCurrentMonth && dayOfMonth > 0
      ? Math.round((usage.usedMinutes / dayOfMonth) * daysInMonth)
      : null;

  const percent =
    usage.includedMinutes && usage.includedMinutes > 0
      ? Math.min(100, (usage.usedMinutes / usage.includedMinutes) * 100)
      : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          label="Minutes used"
          value={usage.usedMinutes.toLocaleString()}
          hint={
            usage.includedMinutes != null
              ? `of ${usage.includedMinutes.toLocaleString()} included`
              : "included quota unknown"
          }
        />
        <Metric
          label="Net cost"
          value={USD.format(usage.netAmount)}
          hint="this billing cycle"
        />
        <Metric
          label="Days remaining"
          value={String(daysRemaining)}
          hint={isCurrentMonth ? "until cycle reset" : "cycle closed"}
        />
        <Metric
          label="Projected"
          value={
            projection != null ? `${projection.toLocaleString()} min` : "—"
          }
          hint="linear, end of month"
        />
      </div>

      {percent != null ? (
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={
              percent >= 90
                ? "h-full rounded-full bg-destructive"
                : percent >= 70
                  ? "h-full rounded-full bg-amber-500"
                  : "h-full rounded-full bg-chart-1"
            }
            style={{ width: `${Math.max(percent, usage.usedMinutes > 0 ? 2 : 0)}%` }}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily usage</CardTitle>
            <p className="text-xs text-muted-foreground">
              Billable minutes per day · {usage.periodLabel}
            </p>
          </CardHeader>
          <CardContent>
            <ActionsUsageTrendChart data={usage.byDay} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">By operating system</CardTitle>
            <p className="text-xs text-muted-foreground">Billable minutes</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {usage.byOs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No usage recorded.
              </p>
            ) : (
              usage.byOs.map((os) => {
                const share =
                  usage.usedMinutes > 0
                    ? (os.minutes / usage.usedMinutes) * 100
                    : 0;
                return (
                  <div key={os.os} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-muted-foreground" />
                        {os.os}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {os.minutes.toLocaleString()} min
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-chart-2"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
            <p className="pt-1 text-[11px] text-muted-foreground/80">
              Allowance is consumed at 1× Linux, 2× Windows, 10× macOS per runner
              minute.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle className="text-base">Top repositories</CardTitle>
            <p className="text-xs text-muted-foreground">
              By billable minutes this cycle
            </p>
          </div>
          <DollarSign className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {usage.byRepo.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              No billable repository usage this month.
            </p>
          ) : (
            usage.byRepo.slice(0, 10).map((repo) => {
              const share =
                usage.usedMinutes > 0
                  ? (repo.minutes / usage.usedMinutes) * 100
                  : 0;
              return (
                <div
                  key={repo.repo}
                  className="relative overflow-hidden rounded-lg border px-3 py-2"
                >
                  <div
                    aria-hidden
                    className="absolute inset-y-0 left-0 bg-chart-1/10"
                    style={{ width: `${share}%` }}
                  />
                  <div className="relative flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{repo.repo}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {repo.minutes.toLocaleString()} min ·{" "}
                      {USD.format(repo.netAmount)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
