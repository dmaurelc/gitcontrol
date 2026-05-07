import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  GitPullRequest,
  GitMerge,
  CircleDot,
  CircleCheck,
  MessageSquare,
} from "lucide-react";
import type { SearchIssueItem } from "@/lib/github/service";
import { cn } from "@/lib/utils";

type IssueRowProps = {
  item: SearchIssueItem;
  kind: "pr" | "issue";
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function repoFromUrl(repositoryUrl: string): string {
  // e.g. https://api.github.com/repos/owner/repo
  const m = repositoryUrl.match(/\/repos\/([^/]+\/[^/]+)$/);
  return m ? m[1] : "";
}

export function IssueRow({ item, kind }: IssueRowProps) {
  const repo = repoFromUrl(item.repository_url);
  const isClosed = item.state === "closed";
  const Icon =
    kind === "pr"
      ? isClosed
        ? GitMerge
        : GitPullRequest
      : isClosed
        ? CircleCheck
        : CircleDot;
  const iconColor =
    kind === "pr"
      ? isClosed
        ? "text-violet-500"
        : "text-emerald-500"
      : isClosed
        ? "text-violet-500"
        : "text-emerald-500";

  const internalHref = repo
    ? `/repositories/${repo}/${kind === "pr" ? "pulls" : "issues"}/${item.number}`
    : item.html_url;

  return (
    <Link
      href={internalHref}
      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", iconColor)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-baseline gap-2">
          <p className="truncate text-sm font-medium">{item.title}</p>
          {item.draft ? (
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[0.625rem] font-medium uppercase text-muted-foreground">
              draft
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{repo}</span>
          <span>#{item.number}</span>
          <span aria-hidden>·</span>
          <span>opened {relativeTime(item.created_at)}</span>
          {item.user ? (
            <>
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1.5">
                by
                <Avatar className="size-4">
                  <AvatarImage src={item.user.avatar_url} alt={item.user.login} />
                  <AvatarFallback className="text-[0.5rem]">
                    {item.user.login.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {item.user.login}
              </span>
            </>
          ) : null}
        </div>
      </div>
      {item.comments > 0 ? (
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground tabular-nums">
          <MessageSquare className="size-3.5" />
          {item.comments}
        </span>
      ) : null}
    </Link>
  );
}
