import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { githubService } from "@/lib/github/service";
import type { ContributionDay } from "@/lib/github/service";
import { ContributionHeatmapGrid } from "./contribution-heatmap-grid";
import { ContributionYearSelect } from "./contribution-year-select";

type Props = {
  userId: string;
  /** When provided, fetches that calendar year. Otherwise rolling 12 months. */
  year?: number;
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Ensures days span Jan 1 → Dec 31 of the given year, filling gaps with 0. */
function padCalendarYear(
  days: ContributionDay[],
  year: number,
): ContributionDay[] {
  const byDate = new Map(days.map((d) => [d.date, d.count]));
  const out: ContributionDay[] = [];
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));
  for (
    let t = start.getTime();
    t <= end.getTime();
    t += 24 * 60 * 60 * 1000
  ) {
    const key = isoDate(new Date(t));
    out.push({ date: key, count: byDate.get(key) ?? 0 });
  }
  return out;
}

/** Server-side wrapper. Fetches contribution data and renders the client grid. */
export async function ContributionHeatmap({ userId, year }: Props) {
  let days: ContributionDay[] = [];
  let total = 0;
  let joinYear: number | null = null;
  try {
    const [res, jy] = await Promise.allSettled([
      githubService.getContributionsHeatmap(userId, year),
      githubService.getViewerJoinYear(userId),
    ]);
    if (res.status === "fulfilled") {
      days = res.value.data;
      total = res.value.total;
    }
    if (jy.status === "fulfilled") {
      joinYear = jy.value;
    }
  } catch {
    // render empty state inside the grid
  }

  const currentYear = new Date().getUTCFullYear();
  const startYear = joinYear ?? currentYear - 3;
  const years: number[] = [];
  for (let y = currentYear; y >= startYear; y--) years.push(y);

  // When a calendar year is selected, pad days so the grid always covers
  // Jan 1 → Dec 31 (53 weeks). Future days render as empty cells (count=0)
  // so the chart keeps a stable, GitHub-style width.
  if (typeof year === "number") {
    days = padCalendarYear(days, year);
  }

  return (
    <Card className="h-full shadow-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle className="text-base">Contribution activity</CardTitle>
            <p className="text-xs text-muted-foreground">
              {year ? `${year}` : "Last 12 months"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {total > 0 && (
              <span className="text-sm font-semibold tabular-nums">
                {total.toLocaleString()}
              </span>
            )}
            <ContributionYearSelect years={years} current={year} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <ContributionHeatmapGrid data={days} />
      </CardContent>
    </Card>
  );
}
