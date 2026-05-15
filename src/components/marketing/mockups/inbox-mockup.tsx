import { cn } from "@/lib/utils";

type Row = {
  repo: string;
  title: string;
  state: "open" | "merged" | "closed" | "draft";
  age: string;
};

const ROWS: Row[] = [
  { repo: "api-server", title: "feat: add webhook signature verification", state: "open", age: "12m" },
  { repo: "api-server", title: "fix: stale cache on org switch", state: "merged", age: "1h" },
  { repo: "infra-stack", title: "chore: bump redis to 7.4", state: "draft", age: "3h" },
  { repo: "web-client", title: "feat: dashboard reorder layout", state: "open", age: "5h" },
  { repo: "api-server", title: "test: cache invalidation regression", state: "closed", age: "1d" },
];

const STATE_STYLES: Record<Row["state"], string> = {
  open: "bg-primary text-primary-foreground border-primary",
  merged: "bg-primary/20 text-primary border-primary/40",
  closed: "bg-destructive text-destructive-foreground border-destructive",
  draft: "bg-muted text-muted-foreground border-border",
};

export function InboxMockup() {
  return (
    <div className="space-y-2 rounded-none bg-background p-4">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        Cross-repo pulls
      </p>
      {ROWS.map((row) => (
        <div
          key={row.title}
          className="flex flex-wrap items-center justify-between gap-2 rounded-none border border-border bg-card p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-sans text-sm text-foreground">
              {row.title}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              your-org/{row.repo} · {row.age} ago
            </p>
          </div>
          <span
            className={cn(
              "rounded-none border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
              STATE_STYLES[row.state],
            )}
          >
            {row.state}
          </span>
        </div>
      ))}
    </div>
  );
}
