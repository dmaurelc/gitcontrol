import Link from "next/link";
import { ExternalLink, GitCommit } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import type { RepoCommit } from "@/lib/github/service";

type Props = {
  commits: RepoCommit[];
};

function dayKey(iso: string | null): string {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toISOString().slice(0, 10);
}

function formatDayHeader(key: string): string {
  if (key === "Unknown") return "Unknown date";
  const d = new Date(`${key}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function commitTitle(message: string): { title: string; body: string } {
  const [first, ...rest] = message.split("\n");
  return { title: first?.trim() ?? "", body: rest.join("\n").trim() };
}

export function CommitsList({ commits }: Props) {
  const groups = new Map<string, RepoCommit[]>();
  for (const c of commits) {
    const key = dayKey(c.commit.author?.date ?? c.commit.committer?.date ?? null);
    const arr = groups.get(key) ?? [];
    arr.push(c);
    groups.set(key, arr);
  }

  return (
    <div className="flex flex-col gap-4">
      {[...groups.entries()].map(([key, items]) => (
        <section key={key} className="flex flex-col gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Commits on {formatDayHeader(key)}
          </h3>
          <Card className="shadow-card">
            <CardContent className="p-0">
              <ul className="divide-y divide-border/60">
                {items.map((c) => (
                  <CommitRow key={c.sha} commit={c} />
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      ))}
    </div>
  );
}

function CommitRow({ commit }: { commit: RepoCommit }) {
  const { title, body } = commitTitle(commit.commit.message);
  const authorLogin = commit.author?.login;
  const authorName = commit.commit.author?.name ?? authorLogin ?? "Unknown";
  const avatarUrl =
    commit.author?.avatar_url ??
    (authorLogin
      ? `https://github.com/${encodeURIComponent(authorLogin)}.png?size=40`
      : null);
  const shortSha = commit.sha.slice(0, 7);
  const isoDate =
    commit.commit.author?.date ?? commit.commit.committer?.date ?? null;
  const timeLabel = isoDate
    ? new Date(isoDate).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <Avatar className="size-7 shrink-0">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={authorName} /> : null}
        <AvatarFallback className="text-[10px]">
          {authorName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="truncate text-sm font-medium" title={title}>
            {title || "(no message)"}
          </p>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {authorLogin ? (
            <Link
              href={`https://github.com/${authorLogin}`}
              target="_blank"
              rel="noreferrer"
              className="font-medium hover:text-foreground"
            >
              {authorLogin}
            </Link>
          ) : (
            <span className="font-medium">{authorName}</span>
          )}
          <span>committed</span>
          {timeLabel ? <span>at {timeLabel}</span> : null}
          {body ? (
            <span className="ml-1 inline-flex items-center gap-1 rounded border bg-muted/30 px-1.5 text-[0.6875rem] uppercase tracking-wide">
              +{body.split("\n").length} lines
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs">
        <a
          href={commit.html_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded border bg-background px-2 py-0.5 font-mono text-[0.6875rem] text-muted-foreground transition-colors hover:text-foreground"
          title={`${shortSha} — open on GitHub`}
        >
          <GitCommit className="size-3" />
          {shortSha}
          <ExternalLink className="size-3" />
        </a>
      </div>
    </li>
  );
}
