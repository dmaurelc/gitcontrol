import { Pin, Search } from "lucide-react";
import { DeviconStackPreview } from "@/components/marketing/devicon-stack-preview";
import { RepoHealthBadge } from "@/components/marketing/repo-health-badge";
import { SyncStatusPill } from "@/components/marketing/sync-status-pill";

const REPOS = [
  { owner: "acme", name: "api-server", visibility: "private", health: 92, age: "2m ago" },
  { owner: "acme", name: "infra-stack", visibility: "private", health: 78, age: "14m ago" },
  { owner: "acme", name: "web-client", visibility: "public", health: 64, age: "3h ago" },
];

const FILTERS = ["LANG: ALL", "VISIBILITY: ALL", "SORT: UPDATED"];

export function RepositoriesMockup() {
  return (
    <div className="space-y-3 rounded-none bg-background p-3 sm:p-4">
      <div className="flex items-center gap-2 rounded-none border border-border bg-card px-3 py-2">
        <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        <span className="truncate font-mono text-xs text-muted-foreground">
          Search repos…
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <span
            key={f}
            className="rounded-none border border-border bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            {f}
          </span>
        ))}
      </div>
      <div className="space-y-2">
        {REPOS.map((repo) => (
          <div
            key={repo.name}
            className="flex flex-col gap-2 rounded-none border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-2">
              <Pin className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
              <span className="truncate font-sans text-sm text-foreground">
                {repo.owner}/<span className="text-primary">{repo.name}</span>
              </span>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {repo.visibility}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <DeviconStackPreview />
              <RepoHealthBadge score={repo.health} />
              <SyncStatusPill fresh={repo.age.includes("m")} ageLabel={repo.age} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
