import { cn } from "@/lib/utils";

type Props = {
  score: number;
  className?: string;
};

export function RepoHealthBadge({ score, className }: Props) {
  const tone =
    score >= 80
      ? "bg-primary text-primary-foreground"
      : score >= 50
        ? "bg-secondary text-foreground"
        : "bg-destructive text-destructive-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-none border border-border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider",
        tone,
        className,
      )}
    >
      Health · {score}
    </span>
  );
}
