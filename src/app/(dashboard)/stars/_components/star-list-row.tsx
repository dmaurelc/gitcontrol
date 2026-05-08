import { Star } from "lucide-react";
import { getLanguageColor } from "@/lib/github/language-colors";

type Props = {
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  htmlUrl: string;
  starredAt: string;
};

export function StarListRow({
  fullName,
  description,
  language,
  stars,
  htmlUrl,
  starredAt,
}: Props) {
  const langColor = getLanguageColor(language);
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
        {language ? (
          <span className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full ring-1 ring-border"
              style={{ backgroundColor: langColor }}
            />
            <span className="text-foreground/80">{language}</span>
          </span>
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
