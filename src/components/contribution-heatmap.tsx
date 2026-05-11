import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { githubService } from "@/lib/github/service";
import type { ContributionDay } from "@/lib/github/service";
import { ContributionHeatmapGrid } from "./contribution-heatmap-grid";

type Props = {
  userId: string;
};

/** Server-side wrapper. Fetches 364-day contribution data and renders the
 *  client grid. Designed for the main dashboard. */
export async function ContributionHeatmap({ userId }: Props) {
  let days: ContributionDay[] = [];
  let total = 0;
  try {
    const res = await githubService.getContributionsHeatmap(userId);
    days = res.data;
    total = res.total;
  } catch {
    // render empty state inside the grid
  }

  return (
    <Card className="h-full shadow-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle className="text-base">Contribution activity</CardTitle>
            <p className="text-xs text-muted-foreground">
              Last 12 months
            </p>
          </div>
          {total > 0 && (
            <span className="text-sm font-semibold tabular-nums">
              {total.toLocaleString()}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <ContributionHeatmapGrid data={days} />
      </CardContent>
    </Card>
  );
}
