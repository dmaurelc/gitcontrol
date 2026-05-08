import { FileCode } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  DependencyRow,
  ManifestWithRows,
} from "../page";
import type { OutdatedSeverity } from "@/lib/dependencies/compute-outdated";
export type { OutdatedSeverity };

const SEVERITY_TONE: Record<OutdatedSeverity, string> = {
  major: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  minor:
    "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  patch:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  prerelease:
    "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
};

type Props = {
  manifest: ManifestWithRows["manifest"];
  rows: DependencyRow[];
  filter: "all" | "outdated";
  severitySet: Set<OutdatedSeverity>;
};

export function ManifestCard({
  manifest,
  rows,
  filter,
  severitySet,
}: Props) {
  const visible = rows.filter((r) => {
    // "Outdated only" hides up-to-date rows.
    if (filter === "outdated" && !r.outdated.isOutdated) return false;
    // Severity filter only narrows the outdated rows. Up-to-date rows
    // are always shown when filter === "all".
    if (r.outdated.isOutdated && !severitySet.has(r.outdated.severity)) {
      return false;
    }
    return true;
  });
  const outdatedCount = rows.filter(
    (r) => r.outdated.isOutdated && severitySet.has(r.outdated.severity),
  ).length;

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b py-3">
        <div className="flex min-w-0 items-center gap-2">
          <FileCode className="size-4 shrink-0 text-muted-foreground" />
          <code className="truncate text-sm font-medium">{manifest.path}</code>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-xs">
          <Badge variant="outline" className="text-[10px]">
            {rows.length} deps
          </Badge>
          {outdatedCount > 0 ? (
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300"
            >
              {outdatedCount} outdated
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {visible.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
            {filter === "outdated"
              ? "No outdated dependencies in this manifest."
              : "No dependencies declared."}
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {visible.map((row, idx) => (
              <DependencyRowItem
                key={`${row.dep.ecosystem}:${row.dep.packageName}:${idx}`}
                row={row}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function DependencyRowItem({ row }: { row: DependencyRow }) {
  const { dep, outdated } = row;
  return (
    <li className="flex items-center gap-3 px-4 py-2.5 text-sm">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate font-medium">{dep.packageName}</span>
        <Badge
          variant="outline"
          className="shrink-0 px-1.5 py-0 text-[10px] uppercase tracking-wide"
        >
          {dep.ecosystem.toLowerCase()}
        </Badge>
      </div>
      <code className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {outdated.current ?? dep.requirements ?? "—"}
      </code>
      {outdated.isOutdated ? (
        <>
          <span className="text-xs text-muted-foreground">→</span>
          <code className="shrink-0 text-xs tabular-nums">
            {outdated.latest}
          </code>
          <span
            className={cn(
              "shrink-0 rounded-full border px-1.5 py-0 text-[10px] font-medium",
              SEVERITY_TONE[outdated.severity],
            )}
          >
            {outdated.severity}
          </span>
        </>
      ) : (
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {dep.ecosystem === "NPM" ? "up to date" : "version check N/A"}
        </span>
      )}
    </li>
  );
}
