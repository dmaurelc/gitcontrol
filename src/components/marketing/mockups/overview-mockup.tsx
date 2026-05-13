import { ContributionHeatmapPreview } from "@/components/marketing/contribution-heatmap-preview";

const KPIS = [
  { label: "Repositories", value: "147", delta: "+3 this week" },
  { label: "Stars", value: "2.4k", delta: "+18" },
  { label: "Open PRs", value: "12", delta: "4 awaiting" },
  { label: "Open issues", value: "38", delta: "9 untriaged" },
];

export function OverviewMockup() {
  return (
    <div className="space-y-3 rounded-none bg-background p-3 sm:p-4">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {KPIS.map((kpi) => (
          <div
            key={kpi.label}
            className="min-w-0 rounded-none border border-border bg-card p-2 sm:p-3"
          >
            <p className="truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
              {kpi.label}
            </p>
            <p className="mt-1 font-sans text-lg tracking-tight text-foreground sm:text-2xl">
              {kpi.value}
            </p>
            <p className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-wider text-primary sm:text-[10px]">
              {kpi.delta}
            </p>
          </div>
        ))}
      </div>
      <ContributionHeatmapPreview />
    </div>
  );
}
