"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/app/actions/notifications";
import type { GitHubNotification } from "@/lib/github/service";
import { cn } from "@/lib/utils";

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

function toInternalRoute(n: GitHubNotification): string | null {
  if (n.subject.url) {
    const issue = n.subject.url.match(/\/repos\/([^/]+\/[^/]+)\/issues\/(\d+)$/);
    if (issue) return `/repositories/${issue[1]}/issues/${issue[2]}`;
    const pr = n.subject.url.match(/\/repos\/([^/]+\/[^/]+)\/pulls\/(\d+)$/);
    if (pr) return `/repositories/${pr[1]}/pulls/${pr[2]}`;
  }
  if (
    n.repository?.full_name &&
    (n.subject.type === "CheckSuite" || n.subject.type === "WorkflowRun")
  ) {
    return `/repositories/${n.repository.full_name}/actions`;
  }
  if (n.repository?.full_name) return `/repositories/${n.repository.full_name}`;
  return null;
}

function toExternalUrl(n: GitHubNotification): string | null {
  const url = n.subject.url;
  if (!url) {
    return n.repository?.full_name
      ? `https://github.com/${n.repository.full_name}`
      : null;
  }
  return url
    .replace("https://api.github.com/repos/", "https://github.com/")
    .replace("/pulls/", "/pull/");
}

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

type Props = {
  initial: GitHubNotification[];
  showRead: boolean;
};

export function NotificationsList({ initial, showRead }: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState(initial);
  const unreadCount = notifications.filter((n) => n.unread).length;

  async function markOne(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
    const fd = new FormData();
    fd.set("threadId", id);
    try {
      await markNotificationReadAction(fd);
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: true } : n)),
      );
    }
  }

  async function handleClick(e: React.MouseEvent, n: GitHubNotification) {
    e.preventDefault();
    const internalHref = toInternalRoute(n);
    const externalUrl = toExternalUrl(n);
    void markOne(n.id);
    if (internalHref) {
      router.push(internalHref);
    } else if (externalUrl) {
      window.open(externalUrl, "_blank", "noopener,noreferrer");
    }
  }

  async function handleMarkAll() {
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await markAllNotificationsReadAction();
    } catch {
      setNotifications(previous);
    }
  }

  function toggleShowRead() {
    const params = new URLSearchParams();
    if (!showRead) params.set("showRead", "1");
    const qs = params.toString();
    router.push(qs ? `/notifications?${qs}` : "/notifications");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={toggleShowRead}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
            showRead
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:text-foreground",
          )}
        >
          {showRead ? "Showing all" : "Unread only"}
        </button>
        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            className="gap-1.5"
          >
            <CheckCheck className="size-3.5" />
            Mark all as read
          </Button>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={showRead ? "No notifications" : "No unread notifications"}
          description="You're all caught up."
        />
      ) : (
        <Card className="shadow-card">
          <CardContent className="p-0">
            <ul className="divide-y divide-border/60">
              {notifications.map((n) => {
                const internalHref = toInternalRoute(n);
                const reasonLabel = REASON_LABELS[n.reason] ?? n.reason;
                const href = internalHref ?? "#";
                return (
                  <li key={n.id}>
                    <Link
                      href={href}
                      onClick={(e) => handleClick(e, n)}
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
                    >
                      <span
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          n.unread ? "bg-primary" : "bg-transparent",
                        )}
                        aria-hidden
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <p
                          className={cn(
                            "truncate text-sm",
                            n.unread ? "font-medium" : "text-muted-foreground",
                          )}
                        >
                          {n.subject.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="truncate">
                            {n.repository?.full_name}
                          </span>
                          <span aria-hidden>·</span>
                          <span>{relativeTime(n.updated_at)}</span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[0.625rem]">
                            {reasonLabel}
                          </span>
                        </div>
                      </div>
                      {!internalHref ? (
                        <ExternalLink
                          className="size-3.5 shrink-0 text-muted-foreground/70"
                          aria-label="Opens in new tab"
                        />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
