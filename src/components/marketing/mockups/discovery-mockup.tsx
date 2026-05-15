import { cn } from "@/lib/utils";

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

const PROJECTS = [
  { name: "Q2 roadmap", items: 12 },
  { name: "Bug triage", items: 47 },
  { name: "MVP backlog", items: 8 },
  { name: "Wave 6", items: 23 },
];

export function DiscoveryMockup() {
  return (
    <div className="grid gap-3 rounded-none bg-background p-3 sm:p-4 sm:grid-cols-2">
      <div className="rounded-none border border-border bg-card p-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Actions runs
        </p>
        <div className="space-y-2">
          {RUNS.map((run) => (
            <div
              key={run.name}
              className="flex items-center justify-between border-b border-border pb-2 last:border-b-0 last:pb-0"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn("size-2 rounded-full", STATUS_DOT[run.status])}
                />
                <span className="font-mono text-xs text-foreground">
                  {run.name}
                </span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                {run.duration}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-none border border-border bg-card p-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Projects v2
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PROJECTS.map((p) => (
            <div
              key={p.name}
              className="rounded-none border border-border bg-background p-2"
            >
              <p className="font-sans text-xs text-foreground">{p.name}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-primary">
                {p.items} items
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
