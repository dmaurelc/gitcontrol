import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { githubService } from "@/lib/github/service";
import type { ViewerEvent } from "@/lib/github/service";
import {
  GitCommit,
  GitPullRequest,
  CircleDot,
  Star,
  Plus,
  GitFork,
  Activity,
} from "lucide-react";

/** Simple relative-time helper. No external dep. */
function relativeTime(isoDate: string | null): string {
  if (!isoDate) return "";
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffS = Math.floor(diffMs / 1000);
  if (diffS < 60) return "now";
  const diffM = Math.floor(diffS / 60);
  if (diffM < 60) return `${diffM}m`;
  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `${diffH}h`;
  return `${Math.floor(diffH / 24)}d`;
}

type EventMeta = {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
};

function describeEvent(event: ViewerEvent): EventMeta {
  const repo = event.repo?.name ?? "unknown/repo";
  const payload = event.payload ?? {};

  switch (event.type) {
    case "PushEvent": {
      const count = payload.size ?? payload.commits?.length ?? 1;
      const ref = (payload.ref ?? "").replace("refs/heads/", "");
      return {
        Icon: GitCommit,
        label: `pushed ${count} commit${count !== 1 ? "s" : ""} to ${ref} in ${repo}`,
      };
    }
    case "PullRequestEvent": {
      const num = payload.pull_request?.number ?? "?";
      const action = payload.action ?? "updated";
      return {
        Icon: GitPullRequest,
        label: `${action} pull request ${repo}#${num}`,
      };
    }
    case "IssuesEvent": {
      const num = payload.issue?.number ?? "?";
      const action = payload.action ?? "updated";
      return {
        Icon: CircleDot,
        label: `${action} issue ${repo}#${num}`,
      };
    }
    case "WatchEvent":
      return { Icon: Star, label: `starred ${repo}` };
    case "CreateEvent": {
      const refType = payload.ref_type ?? "repository";
      const ref = payload.ref ? ` ${payload.ref}` : "";
      return { Icon: Plus, label: `created ${refType}${ref} in ${repo}` };
    }
    case "ForkEvent":
      return { Icon: GitFork, label: `forked ${repo}` };
    default:
      return { Icon: Activity, label: `${event.type?.replace("Event", "") ?? "activity"} in ${repo}` };
  }
}

/** Derives the best internal route for an event, or null when none applies. */
function eventHref(event: ViewerEvent): string | null {
  const repo = event.repo?.name;
  if (!repo) return null;
  const payload = event.payload ?? {};
  switch (event.type) {
    case "PullRequestEvent":
    case "PullRequestReviewEvent":
    case "PullRequestReviewCommentEvent": {
      const num = payload.pull_request?.number;
      return num ? `/repositories/${repo}/pulls/${num}` : `/repositories/${repo}`;
    }
    case "IssuesEvent": {
      const num = payload.issue?.number;
      return num ? `/repositories/${repo}/issues/${num}` : `/repositories/${repo}`;
    }
    case "IssueCommentEvent": {
      const num = payload.issue?.number;
      // GitHub treats PR comments as issue comments; route to issues by default.
      return num ? `/repositories/${repo}/issues/${num}` : `/repositories/${repo}`;
    }
    default:
      return `/repositories/${repo}`;
  }
}

type ActivityFeedProps = {
  userId: string;
  limit?: number;
  page?: number;
};

export async function ActivityFeed({
  userId,
  limit = 10,
  page = 1,
}: ActivityFeedProps) {
  let events: ViewerEvent[] = [];
  try {
    const res = await githubService.listViewerEvents(userId, limit, page);
    events = res.data;
  } catch {
    // empty state on error
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Activity className="mb-2 size-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No recent activity</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col">
      {events.map((event) => {
        const { Icon, label } = describeEvent(event);
        const initials = (event.actor?.login ?? "?").slice(0, 2).toUpperCase();
        const href = eventHref(event);
        const content = (
          <>
            <Avatar className="mt-0.5 size-6 shrink-0">
              {event.actor?.avatar_url ? (
                <AvatarImage src={event.actor.avatar_url} alt={event.actor.login} />
              ) : null}
              <AvatarFallback className="text-[0.6rem]">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <p className="min-w-0 text-xs text-muted-foreground line-clamp-2">{label}</p>
              </div>
              <span className="shrink-0 text-[0.6875rem] text-muted-foreground/70 tabular-nums">
                {relativeTime(event.created_at)}
              </span>
            </div>
          </>
        );
        return (
          <li
            key={event.id}
            className="border-b border-border/50 first:border-t-0 last:border-none"
          >
            {href ? (
              <Link
                href={href}
                className="flex items-start gap-2.5 py-2.5 transition-colors hover:bg-muted/40 -mx-2 px-2 rounded-md"
              >
                {content}
              </Link>
            ) : (
              <div className="flex items-start gap-2.5 py-2.5">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
