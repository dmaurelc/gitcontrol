import { cn } from "@/lib/utils";

const KPIS = [
  { label: "Minutes used", value: "1,284", hint: "of 2,000 included" },
  { label: "Net cost", value: "$0.00", hint: "within free tier" },
];

// Relative bar heights (0-100) for a month of billable minutes per day.
const DAILY = [
  12, 30, 22, 48, 36, 8, 4, 40, 62, 55, 70, 44, 10, 6, 52, 66, 80, 58, 74, 20,
  14, 60, 72, 90, 64, 28, 18, 46, 68, 54,
];

const BY_OS = [
  { os: "Linux", percent: 82 },
  { os: "macOS", percent: 14 },
  { os: "Windows", percent: 4 },
];

const RUNS = [
  { name: "ci.yml", status: "success", duration: "1m 24s" },
  { name: "deploy.yml", status: "running", duration: "0m 32s" },
  { name: "release.yml", status: "failure", duration: "2m 11s" },
];

const STATUS_DOT: Record<string, string> = {
  success: "bg-primary",
  running: "bg-primary animate-pulse",
  failure: "bg-destructive",
};

export function ActionsMockup() {
  return (
    <div className="space-y-3 rounded-none bg-background p-3 sm:p-4">
      <div className="grid grid-cols-2 gap-2">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-none border border-border bg-card p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {k.label}
            </p>
            <p className="mt-1 font-mono text-xl text-foreground">{k.value}</p>
            <p className="font-mono text-[10px] text-primary">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-none border border-border bg-card p-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Daily usage · billable minutes
        </p>
        <div aria-hidden className="flex h-16 items-end gap-[3px]">
          {DAILY.map((h, i) => (
            <span
              key={i}
              className="flex-1 bg-primary/70"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        <div className="rounded-none border border-border bg-card p-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            By OS
          </p>
          <div className="space-y-2">
            {BY_OS.map(({ os, percent }) => (
              <div key={os} className="flex items-center gap-2">
                <span className="w-14 font-mono text-[10px] text-foreground">
                  {os}
                </span>
                <span className="h-1.5 flex-1 bg-muted">
                  <span
                    className="block h-full bg-primary"
                    style={{ width: `${percent}%` }}
                  />
                </span>
                <span className="w-8 text-right font-mono text-[10px] text-muted-foreground">
                  {percent}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-none border border-border bg-card p-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Recent runs
          </p>
          <div className="space-y-2">
            {RUNS.map((run) => (
              <div key={run.name} className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className={cn("size-2 shrink-0 rounded-full", STATUS_DOT[run.status])}
                  />
                  <span className="truncate font-mono text-xs text-foreground">
                    {run.name}
                  </span>
                </div>
                <span className="shrink-0 whitespace-nowrap font-mono text-[10px] text-muted-foreground">
                  {run.duration}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
