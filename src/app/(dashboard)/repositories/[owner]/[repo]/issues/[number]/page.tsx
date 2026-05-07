import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { MarkdownBody } from "@/components/markdown-body";
import { CommentForm } from "@/components/comment-form";
import { StateToggleButton } from "@/components/state-toggle-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  closeIssueAction,
  reopenIssueAction,
  commentIssueAction,
} from "@/app/actions/issues";

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

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string; number: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { owner, repo, number: numberStr } = await params;
  const issueNumber = parseInt(numberStr, 10);

  const [issueResult, commentsResult] = await Promise.allSettled([
    githubService.getIssue(session.user.id, owner, repo, issueNumber),
    githubService.listIssueComments(session.user.id, owner, repo, issueNumber),
  ]);

  if (issueResult.status === "rejected") {
    return (
      <EmptyState
        title="Issue not found"
        description="This issue may not exist or you may not have access."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={`/repositories/${owner}/${repo}/issues`}>
              Back to issues
            </Link>
          </Button>
        }
      />
    );
  }

  const issue = issueResult.value.data;
  const comments =
    commentsResult.status === "fulfilled" ? commentsResult.value.data : [];

  const isOpen = issue.state === "open";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <PageHeader
            plain
            title={`${issue.title} #${issue.number}`}
            className="min-w-0 flex-1"
          />
          <Button asChild variant="ghost" size="icon" className="shrink-0 mt-1">
            <a href={issue.html_url} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              <span className="sr-only">Open on GitHub</span>
            </a>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isOpen ? "default" : "secondary"}>
            {isOpen ? "Open" : "Closed"}
          </Badge>

          {issue.user && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Avatar className="size-5">
                <AvatarImage src={issue.user.avatar_url} />
                <AvatarFallback>{issue.user.login[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>{issue.user.login}</span>
              <span>opened {formatRelative(issue.created_at)}</span>
            </div>
          )}

          {issue.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {issue.labels.map((label) => (
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
      </div>

      {/* Issue body */}
      <Card>
        <CardContent className="pt-4">
          {issue.body ? (
            <MarkdownBody>{issue.body}</MarkdownBody>
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
            description="Be the first to comment on this issue."
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
            action={commentIssueAction}
            owner={owner}
            repo={repo}
            number={issueNumber}
          />
        </CardContent>
      </Card>

      {/* Close / Reopen */}
      <div className="flex justify-end">
        <StateToggleButton
          action={isOpen ? closeIssueAction : reopenIssueAction}
          owner={owner}
          repo={repo}
          number={issueNumber}
          label={isOpen ? "Close issue" : "Reopen issue"}
          successMessage={isOpen ? "Issue cerrado" : "Issue reabierto"}
          variant={isOpen ? "destructive" : "outline"}
        />
      </div>
    </div>
  );
}
