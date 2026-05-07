"use client";
import { Bar, BarChart, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import type { ContributionDay } from "@/lib/github/service";

const chartConfig: ChartConfig = {
  count: {
    label: "Contributions",
    color: "hsl(var(--chart-1))",
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
      className="h-32 w-full"
      initialDimension={{ width: 600, height: 128 }}
    >
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
          cursor={{ fill: "hsl(var(--muted)/0.4)" }}
        />
        <Bar
          dataKey="count"
          fill="var(--color-count)"
          radius={[2, 2, 0, 0]}
          maxBarSize={14}
        />
      </BarChart>
    </ChartContainer>
  );
}
