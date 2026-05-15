import { cn } from "@/lib/utils";

const LANGS = ["TS", "JS", "PG", "RD", "GO"];

type Props = {
  className?: string;
};

export function DeviconStackPreview({ className }: Props) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {LANGS.map((lang) => (
        <span
          key={lang}
          aria-hidden
          className="grid size-5 place-items-center rounded-none border border-border bg-muted font-mono text-[9px] font-semibold tracking-tight text-muted-foreground"
        >
          {lang}
        </span>
      ))}
    </div>
  );
}
