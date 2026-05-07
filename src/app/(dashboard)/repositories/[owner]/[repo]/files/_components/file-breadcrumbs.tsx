import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Props = {
  owner: string;
  repo: string;
  path: string;
};

export function FileBreadcrumbs({ owner, repo, path }: Props) {
  const segments = path ? path.split("/").filter(Boolean) : [];
  const base = `/repositories/${owner}/${repo}/files`;

  return (
    <nav
      aria-label="File path"
      className="flex flex-wrap items-center gap-1 text-sm"
    >
      <Link
        href={base}
        className="font-mono text-muted-foreground transition-colors hover:text-foreground"
      >
        {repo}
      </Link>
      {segments.map((seg, idx) => {
        const upTo = segments.slice(0, idx + 1).join("/");
        const isLast = idx === segments.length - 1;
        return (
          <span key={upTo} className="flex items-center gap-1">
            <ChevronRight className="size-3 text-muted-foreground/50" />
            {isLast ? (
              <span className="font-mono font-medium">{seg}</span>
            ) : (
              <Link
                href={`${base}?path=${encodeURIComponent(upTo)}`}
                className="font-mono text-muted-foreground transition-colors hover:text-foreground"
              >
                {seg}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
