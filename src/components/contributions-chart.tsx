"use client";
import { Area, AreaChart, XAxis, Tooltip } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import type { ContributionDay } from "@/lib/github/service";

const chartConfig: ChartConfig = {
  count: {
    label: "Contributions",
    color: "var(--color-chart-1)",
  },
};

/** Formats "2026-05-07" → "Wed 7" for the x-axis tick */
function shortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const day = d.toLocaleDateString("en-US", { weekday: "short" });
  return `${day} ${d.getDate()}`;
}

type ContributionsChartProps = {
  data: ContributionDay[];
};

export function ContributionsChart({ data }: ContributionsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No contribution data available
      </div>
    );
  }

  // Show every 4th date label to avoid crowding the x-axis
  const tickFormatter = (value: string, index: number) =>
    index % 4 === 0 ? shortDate(value) : "";

  return (
    <ChartContainer
      config={chartConfig}
      className="h-40 w-full"
      initialDimension={{ width: 600, height: 160 }}
    >
      <AreaChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="contrib-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10 }}
          tickFormatter={tickFormatter}
        />
        <Tooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) =>
                typeof label === "string" ? shortDate(label) : String(label ?? "")
              }
            />
          }
          cursor={{ stroke: "var(--color-muted-foreground)", strokeOpacity: 0.3 }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="var(--color-count)"
          strokeWidth={2}
          fill="url(#contrib-fill)"
          dot={false}
          activeDot={{ r: 3 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
