"use client";

import { cn } from "@/lib/utils";

type Props = {
  patch: string | undefined;
  className?: string;
  maxLines?: number;
};

// Renders a unified-diff `patch` (e.g. the string GitHub returns per file) as
// a colored line-by-line listing. Keeps things lightweight — no syntax
// highlighting yet (would add ~80KB shiki/prismjs). Truncates very long
// patches to avoid jank on huge files.
export function DiffViewer({ patch, className, maxLines = 500 }: Props) {
  if (!patch) {
    return (
      <p className="px-3 py-2 text-xs italic text-muted-foreground">
        No textual diff available (binary or rename without changes).
      </p>
    );
  }

  const allLines = patch.split("\n");
  const truncated = allLines.length > maxLines;
  const lines = truncated ? allLines.slice(0, maxLines) : allLines;

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-md border bg-muted/30 font-mono text-[11px] leading-5",
        className,
      )}
    >
      <pre className="px-2 py-1">
        {lines.map((line, i) => {
          let className = "block whitespace-pre";
          if (line.startsWith("@@")) className += " text-primary";
          else if (line.startsWith("+") && !line.startsWith("+++"))
            className += " bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
          else if (line.startsWith("-") && !line.startsWith("---"))
            className += " bg-red-500/10 text-red-700 dark:text-red-300";
          else if (line.startsWith("+++") || line.startsWith("---"))
            className += " text-muted-foreground";
          return (
            <code key={i} className={className}>
              {line || " "}
            </code>
          );
        })}
        {truncated ? (
          <code className="block px-1 py-1 text-[10px] text-muted-foreground">
            … truncated ({allLines.length - maxLines} more lines)
          </code>
        ) : null}
      </pre>
    </div>
  );
}
