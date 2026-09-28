"use client";
import { Bar, BarChart, Tooltip, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import type { ActionsDayBucket } from "@/lib/github/actions-billing-parse";

const chartConfig: ChartConfig = {
  minutes: {
    label: "Minutes",
    color: "var(--color-chart-1)",
  },
};

function dayLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function ActionsUsageTrendChart({ data }: { data: ActionsDayBucket[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No daily usage recorded this month.
      </div>
    );
  }

  const tickFormatter = (value: string, index: number) =>
    index % 3 === 0 ? dayLabel(value) : "";

  return (
    <ChartContainer
      config={chartConfig}
      className="h-44 w-full"
      initialDimension={{ width: 600, height: 176 }}
    >
      <BarChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
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
                typeof label === "string" ? dayLabel(label) : String(label ?? "")
              }
            />
          }
          cursor={{ fill: "var(--color-muted)", fillOpacity: 0.4 }}
        />
        <Bar
          dataKey="minutes"
          fill="var(--color-minutes)"
          radius={[3, 3, 0, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ChartContainer>
  );
}
