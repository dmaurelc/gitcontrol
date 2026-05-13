import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  tone?: "primary" | "neutral";
  className?: string;
};

export function StatusBadge({ children, tone = "primary", className }: Props) {
  const palette =
    tone === "primary"
      ? "bg-secondary text-primary"
      : "bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-none border border-border px-2 py-0.5 font-mono text-xs uppercase tracking-wider",
        palette,
        className,
      )}
    >
      {tone === "primary" && (
        <span
          aria-hidden
          className="size-1.5 rounded-full bg-primary"
        />
      )}
      {children}
    </span>
  );
}
