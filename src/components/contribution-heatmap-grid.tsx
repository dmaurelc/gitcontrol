"use client";

import { useState } from "react";
import type { ContributionDay } from "@/lib/github/service";
import { bucketClass, BUCKET_CLASSES } from "./contribution-heatmap-buckets";

const CELL = 11;
const GAP = 2;
const STRIDE = CELL + GAP;
const ROWS = 7;
const LEFT_PAD = 24; // weekday labels
const TOP_PAD = 16; // month labels

type Props = {
  data: ContributionDay[];
};

/** Renders the GitHub-style 7×N week grid as inline SVG. */
export function ContributionHeatmapGrid({ data }: Props) {
  const [hover, setHover] = useState<{
    day: ContributionDay;
    x: number;
    y: number;
  } | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No contribution data available
      </div>
    );
  }

  // Pad the first week so col 0 starts on Sunday (GitHub convention).
  // GitHub already returns aligned weeks, but we compute defensively from the
  // first entry's UTC weekday.
  const firstDate = new Date(data[0].date + "T00:00:00Z");
  const firstWeekday = firstDate.getUTCDay(); // 0=Sun
  const totalCells = data.length + firstWeekday;
  const cols = Math.ceil(totalCells / ROWS);

  const width = LEFT_PAD + cols * STRIDE;
  const height = TOP_PAD + ROWS * STRIDE;

  // Month label positions: place a label at the first column of each month.
  const monthLabels: Array<{ x: number; label: string }> = [];
  let lastMonth = -1;
  for (let i = 0; i < data.length; i++) {
    const d = new Date(data[i].date + "T00:00:00Z");
    const m = d.getUTCMonth();
    if (m !== lastMonth) {
      const cellIndex = i + firstWeekday;
      const col = Math.floor(cellIndex / ROWS);
      // Skip if this column would clip with previous label (<3 cols apart).
      const x = LEFT_PAD + col * STRIDE;
      const prev = monthLabels[monthLabels.length - 1];
      if (!prev || x - prev.x > 3 * STRIDE) {
        monthLabels.push({
          x,
          label: d.toLocaleDateString("en-US", {
            month: "short",
            timeZone: "UTC",
          }),
        });
      }
      lastMonth = m;
    }
  }

  const dayLabelRows: Array<{ row: number; label: string }> = [
    { row: 1, label: "Mon" },
    { row: 3, label: "Wed" },
    { row: 5, label: "Fri" },
  ];

  function tooltipLabel(day: ContributionDay): string {
    const d = new Date(day.date + "T00:00:00Z");
    const dateStr = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
    const noun = day.count === 1 ? "contribution" : "contributions";
    return `${day.count} ${noun} on ${dateStr}`;
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Contribution heatmap, ${data.reduce((s, d) => s + d.count, 0)} contributions over the last year`}
          className="block"
          onMouseLeave={() => setHover(null)}
        >
          {/* Month labels */}
          {monthLabels.map((m) => (
            <text
              key={`${m.x}-${m.label}`}
              x={m.x}
              y={TOP_PAD - 6}
              className="fill-muted-foreground text-[10px]"
            >
              {m.label}
            </text>
          ))}

          {/* Weekday labels */}
          {dayLabelRows.map((d) => (
            <text
              key={d.label}
              x={0}
              y={TOP_PAD + d.row * STRIDE + CELL - 1}
              className="fill-muted-foreground text-[10px]"
            >
              {d.label}
            </text>
          ))}

          {/* Cells */}
          {data.map((day, i) => {
            const cellIndex = i + firstWeekday;
            const col = Math.floor(cellIndex / ROWS);
            const row = cellIndex % ROWS;
            const x = LEFT_PAD + col * STRIDE;
            const y = TOP_PAD + row * STRIDE;
            const label = tooltipLabel(day);
            return (
              <rect
                key={day.date}
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                rx={2}
                ry={2}
                className={`${bucketClass(day.count)} transition-colors`}
                onMouseEnter={() => setHover({ day, x: x + CELL / 2, y })}
                onFocus={() => setHover({ day, x: x + CELL / 2, y })}
                tabIndex={-1}
              >
                <title>{label}</title>
              </rect>
            );
          })}
        </svg>
      </div>

      {/* Floating tooltip */}
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md"
          style={{ left: hover.x, top: hover.y - 4 }}
        >
          {tooltipLabel(hover.day)}
        </div>
      )}

      {/* Legend */}
      <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>Less</span>
        {([0, 1, 2, 3, 4] as const).map((b) => (
          <svg key={b} width={CELL} height={CELL} aria-hidden="true">
            <rect
              width={CELL}
              height={CELL}
              rx={2}
              ry={2}
              className={BUCKET_CLASSES[b]}
            />
          </svg>
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
