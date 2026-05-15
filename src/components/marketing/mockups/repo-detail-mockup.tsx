import { cn } from "@/lib/utils";

const TABS = [
  "overview",
  "issues",
  "pulls",
  "files",
  "commits",
  "insights",
  "actions",
  "dependencies",
];

const ASIDE = [
  { label: "Releases", value: "v0.9.3" },
  { label: "Tags", value: "12" },
  { label: "Contributors", value: "5" },
];

export function RepoDetailMockup() {
  return (
    <div className="space-y-3 rounded-none bg-background p-4">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        your-org / <span className="text-foreground">your-repo</span>
      </p>
      <div className="-mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab, i) => (
          <span
            key={tab}
            className={cn(
              "shrink-0 border-b-2 px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider",
              i === 0
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground",
            )}
          >
            {tab}
          </span>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr,140px]">
        <div className="space-y-2 rounded-none border border-border bg-card p-3">
          <div className="h-2 w-3/4 bg-muted" />
          <div className="h-2 w-full bg-muted" />
          <div className="h-2 w-5/6 bg-muted" />
          <div className="h-2 w-2/3 bg-muted" />
          <div className="mt-3 h-2 w-1/2 bg-muted" />
        </div>
        <aside className="space-y-2">
          {ASIDE.map((row) => (
            <div
              key={row.label}
              className="rounded-none border border-border bg-card px-2 py-2"
            >
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {row.label}
              </p>
              <p className="font-sans text-sm text-foreground">{row.value}</p>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
