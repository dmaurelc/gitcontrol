"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/app/actions/notifications";
import type { GitHubNotification } from "@/lib/github/service";

// Maps GitHub notification reason to a short human label
const REASON_LABELS: Record<string, string> = {
  assign: "assigned",
  author: "author",
  comment: "comment",
  invitation: "invited",
  manual: "subscribed",
  mention: "mentioned",
  review_requested: "review",
  security_alert: "security",
  state_change: "state",
  subscribed: "watching",
  team_mention: "team",
  ci_activity: "CI",
};

/** Attempts to convert a GitHub API subject URL to an internal app route. */
function toInternalRoute(notification: GitHubNotification): string | null {
  const { subject, repository } = notification;

  if (subject.url) {
    const issueMatch = subject.url.match(/\/repos\/([^/]+\/[^/]+)\/issues\/(\d+)$/);
    if (issueMatch) return `/repositories/${issueMatch[1]}/issues/${issueMatch[2]}`;

    const prMatch = subject.url.match(/\/repos\/([^/]+\/[^/]+)\/pulls\/(\d+)$/);
    if (prMatch) return `/repositories/${prMatch[1]}/pulls/${prMatch[2]}`;
  }

  // CI / CheckSuite notifications have a null subject.url; route to the repo's
  // actions tab so the user can find the failed/finished run.
  if (
    repository?.full_name &&
    (subject.type === "CheckSuite" || subject.type === "WorkflowRun")
  ) {
    return `/repositories/${repository.full_name}/actions`;
  }

  if (repository?.full_name) return `/repositories/${repository.full_name}`;
  return null;
}

/** Falls back to a github.com URL for subjects without an internal route. */
function toExternalUrl(notification: GitHubNotification): string | null {
  const url = notification.subject.url;
  if (!url) {
    return notification.repository?.full_name
      ? `https://github.com/${notification.repository.full_name}`
      : null;
  }
  return url
    .replace("https://api.github.com/repos/", "https://github.com/")
    .replace("/pulls/", "/pull/");
}

type NotificationsBellProps = {
  initialNotifications: GitHubNotification[];
};

export function NotificationsBell({ initialNotifications }: NotificationsBellProps) {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState(initialNotifications);
  const unreadCount = notifications.filter((n) => n.unread).length;

  async function handleClick(n: GitHubNotification) {
    const internalHref = toInternalRoute(n);
    const externalUrl = toExternalUrl(n);

    // Optimistic mark as read
    setNotifications((prev) =>
      prev.map((m) => (m.id === n.id ? { ...m, unread: false } : m)),
    );
    const fd = new FormData();
    fd.set("threadId", n.id);
    try {
      await markNotificationReadAction(fd);
    } catch {
      setNotifications((prev) =>
        prev.map((m) => (m.id === n.id ? { ...m, unread: true } : m)),
      );
    }

    if (internalHref) {
      router.push(internalHref);
    } else if (externalUrl) {
      window.open(externalUrl, "_blank", "noopener,noreferrer");
    }
  }

  async function handleMarkAll(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await markAllNotificationsReadAction();
    } catch {
      setNotifications(previous);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center p-0 text-[0.6rem] leading-none"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Notifications</span>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={handleMarkAll}
              className="inline-flex items-center gap-1 rounded text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <CheckCheck className="size-3" />
              Mark all read
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((n) => {
              const reasonLabel = REASON_LABELS[n.reason] ?? n.reason;
              return (
                <DropdownMenuItem
                  key={n.id}
                  className="flex flex-col items-start gap-0.5 px-3 py-2.5 focus:bg-accent"
                  onSelect={() => void handleClick(n)}
                >
                  <div className="flex w-full items-start gap-2">
                    {n.unread && (
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                    <span
                      className={`flex-1 truncate text-xs font-medium leading-snug ${!n.unread ? "text-muted-foreground" : ""}`}
                    >
                      {n.subject.title}
                    </span>
                  </div>
                  <div className="flex w-full items-center gap-2 pl-3.5">
                    <span className="min-w-0 flex-1 truncate text-[0.6875rem] text-muted-foreground/80">
                      {n.repository?.full_name}
                    </span>
                    <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[0.625rem] text-muted-foreground">
                      {reasonLabel}
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/notifications"
            className="w-full cursor-pointer justify-center text-xs font-medium"
          >
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
