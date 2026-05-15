import { cn } from "@/lib/utils";

type Props = { className?: string };

export function CmdKHint({ className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-xs",
        className,
      )}
    >
      <kbd className="rounded-none border border-border bg-muted px-1.5 py-0.5 text-foreground">
        ⌘
      </kbd>
      <kbd className="rounded-none border border-border bg-muted px-1.5 py-0.5 text-foreground">
        K
      </kbd>
    </span>
  );
}
