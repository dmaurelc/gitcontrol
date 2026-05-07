"use client";
import { Bar, BarChart, XAxis, Tooltip, YAxis } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import type { CommitActivityWeek } from "@/lib/github/service";

const chartConfig: ChartConfig = {
  total: {
    label: "Commits",
    color: "var(--color-chart-1)",
  },
};

function weekLabel(epoch: number): string {
  return new Date(epoch * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

type Props = { data: CommitActivityWeek[] };

export function CommitActivityChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No commit data
      </div>
    );
  }
  // Format every 8th tick (~2 months)
  const tickFormatter = (value: number, index: number) =>
    index % 8 === 0 ? weekLabel(value) : "";

  return (
    <ChartContainer
      config={chartConfig}
      className="h-48 w-full"
      initialDimension={{ width: 800, height: 192 }}
    >
      <BarChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="week"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10 }}
          tickFormatter={tickFormatter}
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
                typeof label === "number" ? weekLabel(label) : String(label ?? "")
              }
            />
          }
          cursor={{ fill: "var(--color-muted)", fillOpacity: 0.4 }}
        />
        <Bar dataKey="total" fill="var(--color-total)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
