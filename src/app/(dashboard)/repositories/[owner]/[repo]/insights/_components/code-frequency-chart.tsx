"use client";
import { Line, LineChart, XAxis, Tooltip, YAxis, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import type { CodeFrequencyWeek } from "@/lib/github/service";

const chartConfig: ChartConfig = {
  additions: { label: "Additions", color: "var(--color-chart-2)" },
  deletions: { label: "Deletions", color: "var(--color-chart-5)" },
};

function weekLabel(epoch: number): string {
  return new Date(epoch * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

type Props = { data: CodeFrequencyWeek[] };

type Row = { week: number; additions: number; deletions: number };

export function CodeFrequencyChart({ data }: Props) {
  const rows: Row[] = data.map(([w, add, del]) => ({
    week: w,
    additions: add,
    deletions: Math.abs(del),
  }));

  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No code frequency data
      </div>
    );
  }
  const tickFormatter = (value: number, index: number) =>
    index % 8 === 0 ? weekLabel(value) : "";

  return (
    <ChartContainer
      config={chartConfig}
      className="h-48 w-full"
      initialDimension={{ width: 800, height: 192 }}
    >
      <LineChart data={rows} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
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
          width={36}
        />
        <Tooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) =>
                typeof label === "number" ? weekLabel(label) : String(label ?? "")
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
          dataKey="additions"
          stroke="var(--color-additions)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="deletions"
          stroke="var(--color-deletions)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
