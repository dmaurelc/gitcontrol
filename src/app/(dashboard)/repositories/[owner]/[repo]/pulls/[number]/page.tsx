import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, ExternalLink, GitMerge, GitPullRequest } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { MarkdownBody } from "@/components/markdown-body";
import { CommentForm } from "@/components/comment-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  closePullRequestAction,
  reopenPullRequestAction,
  commentPullRequestAction,
} from "@/app/actions/pulls";

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

type PrStatus = "open" | "closed" | "merged" | "draft";

function getPrStatus(pr: {
  state: string;
  merged: boolean;
  draft: boolean;
}): PrStatus {
  if (pr.merged) return "merged";
  if (pr.draft && pr.state === "open") return "draft";
  if (pr.state === "closed") return "closed";
  return "open";
}

const statusConfig: Record<
  PrStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  open: { label: "Open", variant: "default" },
  draft: { label: "Draft", variant: "outline" },
  merged: { label: "Merged", variant: "secondary" },
  closed: { label: "Closed", variant: "destructive" },
};

export default async function PullRequestDetailPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string; number: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { owner, repo, number: numberStr } = await params;
  const pullNumber = parseInt(numberStr, 10);

  const [prResult, commentsResult] = await Promise.allSettled([
    githubService.getPullRequest(session.user.id, owner, repo, pullNumber),
    githubService.listPullRequestComments(session.user.id, owner, repo, pullNumber),
  ]);

  if (prResult.status === "rejected") {
    return (
      <EmptyState
        title="Pull request not found"
        description="This pull request may not exist or you may not have access."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={`/repositories/${owner}/${repo}/pulls`}>
              Back to pull requests
            </Link>
          </Button>
        }
      />
    );
  }

  const pr = prResult.value.data;
  const comments =
    commentsResult.status === "fulfilled" ? commentsResult.value.data : [];

  const status = getPrStatus(pr);
  const { label, variant } = statusConfig[status];
  const canChangeState = !pr.merged; // merged PRs cannot be reopened/closed
  const isOpen = pr.state === "open";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <PageHeader
            plain
            title={`${pr.title} #${pr.number}`}
            className="min-w-0 flex-1"
          />
          <Button asChild variant="ghost" size="icon" className="shrink-0 mt-1">
            <a href={pr.html_url} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              <span className="sr-only">Open on GitHub</span>
            </a>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={variant}>{label}</Badge>

          {pr.user && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Avatar className="size-5">
                <AvatarImage src={pr.user.avatar_url} />
                <AvatarFallback>{pr.user.login[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>{pr.user.login}</span>
              <span>opened {formatRelative(pr.created_at)}</span>
            </div>
          )}

          {/* Branch info */}
          <span className="text-xs text-muted-foreground font-mono">
            {pr.head.ref} → {pr.base.ref}
          </span>

          {pr.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {pr.labels.map((label) => (
                <Badge
                  key={label.id}
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: `#${label.color}`, color: `#${label.color}` }}
                >
                  {label.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Diff stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {status === "merged" ? (
              <GitMerge className="size-3.5 text-purple-500" />
            ) : (
              <GitPullRequest className="size-3.5 text-emerald-500" />
            )}
            {pr.changed_files} file{pr.changed_files === 1 ? "" : "s"} changed
          </span>
          <span className="text-emerald-600">+{pr.additions}</span>
          <span className="text-red-500">−{pr.deletions}</span>
        </div>
      </div>

      {/* PR body */}
      <Card>
        <CardContent className="pt-4">
          {pr.body ? (
            <MarkdownBody>{pr.body}</MarkdownBody>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No description provided.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Comments */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {comments.length === 0
            ? "No comments yet"
            : `${comments.length} comment${comments.length === 1 ? "" : "s"}`}
        </h2>

        {comments.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No comments"
            description="Be the first to comment on this pull request."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {comments.map((comment) => (
              <li key={comment.id}>
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2 pb-2 pt-3 px-4">
                    {comment.user && (
                      <>
                        <Avatar className="size-6">
                          <AvatarImage src={comment.user.avatar_url} />
                          <AvatarFallback>
                            {comment.user.login[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {comment.user.login}
                        </span>
                      </>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatRelative(comment.created_at)}
                    </span>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-3">
                    {comment.body ? (
                      <MarkdownBody>{comment.body}</MarkdownBody>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Empty comment.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Comment form */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <h3 className="text-sm font-semibold">Leave a comment</h3>
        </CardHeader>
        <CardContent>
          <CommentForm
            action={commentPullRequestAction}
            owner={owner}
            repo={repo}
            number={pullNumber}
          />
        </CardContent>
      </Card>

      {/* Close / Reopen (only for non-merged PRs) */}
      {canChangeState && (
        <div className="flex justify-end">
          <form action={isOpen ? closePullRequestAction : reopenPullRequestAction}>
            <input type="hidden" name="owner" value={owner} />
            <input type="hidden" name="repo" value={repo} />
            <input type="hidden" name="number" value={pullNumber} />
            <Button
              type="submit"
              variant={isOpen ? "destructive" : "outline"}
              size="sm"
            >
              {isOpen ? "Close pull request" : "Reopen pull request"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
