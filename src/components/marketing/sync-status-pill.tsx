import { cn } from "@/lib/utils";

type Props = {
  fresh: boolean;
  ageLabel: string;
  className?: string;
};

export function SyncStatusPill({ fresh, ageLabel, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-none border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider",
        fresh
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          fresh ? "bg-primary-foreground" : "bg-muted-foreground",
        )}
      />
      {fresh ? "Synced" : "Stale"} · {ageLabel}
    </span>
  );
}
