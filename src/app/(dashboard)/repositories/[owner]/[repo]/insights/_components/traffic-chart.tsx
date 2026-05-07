"use client";
import { Line, LineChart, XAxis, Tooltip, YAxis, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import type { RepoTrafficViews } from "@/lib/github/service";

const chartConfig: ChartConfig = {
  views: { label: "Views", color: "var(--color-chart-1)" },
  clones: { label: "Clones", color: "var(--color-chart-3)" },
};

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

type Props = {
  views: RepoTrafficViews | null;
  clones: RepoTrafficViews | null;
};

type Row = {
  date: string;
  views: number;
  clones: number;
};

export function TrafficChart({ views, clones }: Props) {
  // Merge views + clones by timestamp date
  const map = new Map<string, Row>();
  for (const v of views?.views ?? []) {
    map.set(v.timestamp, {
      date: v.timestamp,
      views: v.count,
      clones: 0,
    });
  }
  for (const c of clones?.views ?? []) {
    const existing = map.get(c.timestamp);
    if (existing) existing.clones = c.count;
    else map.set(c.timestamp, { date: c.timestamp, views: 0, clones: c.count });
  }
  const rows = [...map.values()].sort((a, b) => a.date.localeCompare(b.date));

  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No traffic data for the last 14 days
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="h-48 w-full"
      initialDimension={{ width: 800, height: 192 }}
    >
      <LineChart data={rows} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => dayLabel(String(v))}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10 }}
          width={28}
        />
        <Tooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) =>
                typeof label === "string" ? dayLabel(label) : String(label ?? "")
              }
            />
          }
          cursor={{ stroke: "var(--color-muted-foreground)", strokeOpacity: 0.3 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          iconType="circle"
          iconSize={8}
          align="right"
          verticalAlign="top"
        />
        <Line
          type="monotone"
          dataKey="views"
          stroke="var(--color-views)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="clones"
          stroke="var(--color-clones)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
