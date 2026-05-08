import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HealthScore } from "@/lib/github/health-score";

type Props = {
  score: HealthScore;
  className?: string;
  /** When true, hides the badge entirely (e.g. for archived repos). */
  hidden?: boolean;
};

const TONES: Record<HealthScore["band"], string> = {
  good: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warn: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  bad: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

export function RepoHealthBadge({ score, className, hidden }: Props) {
  if (hidden) return null;
  const { total, band, breakdown } = score;
  const tooltip = [
    `Health ${total}/100`,
    `commit recency ${breakdown.commitRecency}`,
    `PR age ${breakdown.prAge}`,
    `issue staleness ${breakdown.issueStaleness}`,
    `actions ${breakdown.actionsStatus}`,
  ].join(" · ");
  return (
    <span
      title={tooltip}
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full border px-1.5 text-[10px] font-medium tabular-nums",
        TONES[band],
        className,
      )}
    >
      <Activity className="size-2.5" />
      {total}
    </span>
  );
}
