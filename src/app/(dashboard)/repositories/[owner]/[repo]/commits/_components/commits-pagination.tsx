import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  owner: string;
  repo: string;
  page: number;
  hasNextPage: boolean;
  branch?: string;
  author?: string;
  since?: string;
  until?: string;
};

export function CommitsPagination({
  owner,
  repo,
  page,
  hasNextPage,
  branch,
  author,
  since,
  until,
}: Props) {
  const base = `/repositories/${owner}/${repo}/commits`;

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (branch) params.set("branch", branch);
    if (author) params.set("author", author);
    if (since) params.set("since", since);
    if (until) params.set("until", until);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const prevDisabled = page <= 1;

  return (
    <nav className="flex items-center justify-end gap-2 text-xs">
      <PageLink
        href={prevDisabled ? null : buildHref(page - 1)}
        label="Newer"
        icon="left"
      />
      <span className="px-2 text-muted-foreground tabular-nums">
        Page {page}
      </span>
      <PageLink
        href={hasNextPage ? buildHref(page + 1) : null}
        label="Older"
        icon="right"
      />
    </nav>
  );
}

function PageLink({
  href,
  label,
  icon,
}: {
  href: string | null;
  label: string;
  icon: "left" | "right";
}) {
  const className = cn(
    "inline-flex items-center gap-1 rounded border px-2.5 py-1 transition-colors",
    href
      ? "hover:bg-muted hover:text-foreground"
      : "cursor-not-allowed text-muted-foreground/50",
  );
  const content = (
    <>
      {icon === "left" ? <ChevronLeft className="size-3" /> : null}
      {label}
      {icon === "right" ? <ChevronRight className="size-3" /> : null}
    </>
  );
  if (!href) {
    return <span className={className}>{content}</span>;
  }
  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
