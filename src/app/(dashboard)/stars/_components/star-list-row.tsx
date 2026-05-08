import { Star } from "lucide-react";
import { DeviconStack } from "@/components/devicon-stack";

type Props = {
  fullName: string;
  description: string | null;
  language: string | null;
  languages?: Record<string, number>;
  stars: number;
  htmlUrl: string;
  starredAt: string;
};

export function StarListRow({
  fullName,
  description,
  language,
  languages,
  stars,
  htmlUrl,
  starredAt,
}: Props) {
  const stackInput: Record<string, number> | string[] =
    languages && Object.keys(languages).length > 0
      ? languages
      : language
        ? [language]
        : [];
  const hasStack = Array.isArray(stackInput)
    ? stackInput.length > 0
    : Object.keys(stackInput).length > 0;
  return (
    <a
      href={htmlUrl}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-3 rounded-md border bg-card/50 px-3 py-2.5 shadow-soft transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold leading-tight group-hover:underline">
          {fullName}
        </span>
        {description ? (
          <span className="truncate text-xs text-muted-foreground">
            {description}
          </span>
        ) : null}
      </div>

      <div className="hidden shrink-0 items-center gap-3 text-xs text-muted-foreground tabular-nums sm:flex">
        {hasStack ? (
          <DeviconStack languages={stackInput} max={2} size={14} />
        ) : null}
        <span className="flex items-center gap-1" title="Stars">
          <Star className="size-3" />
          {stars}
        </span>
        <span className="text-[11px]">
          Starred {new Date(starredAt).toLocaleDateString()}
        </span>
      </div>
    </a>
  );
}
