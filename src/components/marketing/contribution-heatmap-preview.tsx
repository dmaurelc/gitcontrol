import { StatusBadge } from "@/components/marketing/status-badge";

// Static deterministic heatmap mockup: 52 weeks x 7 days = 364 cells.
// Fill level derived from a simple hash so the rendered SVG looks plausible
// across refreshes without being randomized client-side.
const WEEKS = 52;
const DAYS = 7;
const CELL = 7;
const GAP = 1.5;
const RADIUS = 1;

const LEVELS = [
  "var(--color-muted)",
  "color-mix(in oklch, var(--color-primary) 25%, transparent)",
  "color-mix(in oklch, var(--color-primary) 45%, transparent)",
  "color-mix(in oklch, var(--color-primary) 70%, transparent)",
  "var(--color-primary)",
];

function level(week: number, day: number) {
  const seed = (week * 7 + day * 3 + 11) % 13;
  if (seed < 6) return 0;
  if (seed < 9) return 1;
  if (seed < 11) return 2;
  if (seed < 12) return 3;
  return 4;
}

export function ContributionHeatmapPreview() {
  const cells: React.ReactNode[] = [];
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < DAYS; d++) {
      cells.push(
        <rect
          key={`${w}-${d}`}
          x={w * (CELL + GAP)}
          y={d * (CELL + GAP)}
          width={CELL}
          height={CELL}
          rx={RADIUS}
          ry={RADIUS}
          fill={LEVELS[level(w, d)]}
        />,
      );
    }
  }
  const width = WEEKS * (CELL + GAP);
  const height = DAYS * (CELL + GAP);

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Contributions · last 365 days
        </p>
        <StatusBadge tone="neutral">2026</StatusBadge>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="block h-auto w-full"
        role="img"
        aria-label="GitHub contribution heatmap preview"
      >
        {cells}
      </svg>
      <div className="mt-3 flex items-center justify-end gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Less</span>
        {LEVELS.map((fill, i) => (
          <span
            key={i}
            className="size-2.5"
            style={{ backgroundColor: fill }}
            aria-hidden
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
