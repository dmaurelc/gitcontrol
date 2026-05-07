import { CircleDot, CircleCheck, GitPullRequest, GitMerge, Inbox, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";

export type IssueLike = {
  id: number;
  number: number;
  title: string;
  state: string;
  user: { login: string; avatar_url: string } | null;
  created_at: string;
  comments: number;
  html_url: string;
  pull_request?: unknown;
  // Pull request specific
  merged_at?: string | null;
  draft?: boolean;
};

export function IssueList({
  items,
  kind,
}: {
  items: IssueLike[];
  kind: "issue" | "pr";
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title={kind === "pr" ? "No pull requests" : "No issues"}
        description="Looks quiet here."
      />
    );
  }
  return (
    <ul className="flex flex-col divide-y overflow-hidden rounded-xl border bg-card">
      {items.map((it) => {
        const open = it.state === "open";
        const merged = kind === "pr" && Boolean(it.merged_at);
        const Icon = kind === "pr"
          ? merged
            ? GitMerge
            : GitPullRequest
          : open
            ? CircleDot
            : CircleCheck;
        const iconColor = merged
          ? "text-purple-500"
          : open
            ? "text-emerald-500"
            : "text-zinc-400";
        return (
          <li
            key={it.id}
            className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/40"
          >
            <Icon className={`size-4 shrink-0 ${iconColor}`} />
            <div className="min-w-0 flex-1">
              <a
                href={it.html_url}
                target="_blank"
                rel="noreferrer"
                className="truncate text-sm font-medium hover:underline"
              >
                {it.title}
              </a>
              <p className="text-xs text-muted-foreground">
                #{it.number} opened on{" "}
                {new Date(it.created_at).toLocaleDateString()}
                {it.user ? ` by ${it.user.login}` : null}
              </p>
            </div>
            {kind === "pr" && it.draft ? (
              <Badge variant="outline" className="text-xs">
                Draft
              </Badge>
            ) : null}
            <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
              <MessageSquare className="size-3" />
              {it.comments}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
