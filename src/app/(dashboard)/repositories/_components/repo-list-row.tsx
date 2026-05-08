import Link from "next/link";
import { Star, GitFork, Lock, Globe, CircleAlert } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PinButton } from "./pin-button";
import { DeviconStack } from "@/components/devicon-stack";

type Props = {
  fullName: string;
  description: string | null;
  language: string | null;
  languages?: Record<string, number>;
  stars: number;
  forks: number;
  openIssues: number;
  isPrivate: boolean;
  pushedAt: string;
  pinned?: boolean;
};

export function RepoListRow({
  fullName,
  description,
  language,
  languages,
  stars,
  forks,
  openIssues,
  isPrivate,
  pushedAt,
  pinned = false,
}: Props) {
  const [owner] = fullName.split("/");
  const avatarUrl = owner
    ? `https://github.com/${encodeURIComponent(owner)}.png?size=64`
    : undefined;
  const stackInput: Record<string, number> | string[] =
    languages && Object.keys(languages).length > 0
      ? languages
      : language
        ? [language]
        : [];
  const hasStack = Array.isArray(stackInput)
    ? stackInput.length > 0
    : Object.keys(stackInput).length > 0;

  return (
    <Link
      href={`/repositories/${fullName}`}
      className="group flex items-center gap-3 rounded-md border bg-card/50 px-3 py-2.5 shadow-soft transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Avatar className="size-7 shrink-0 rounded-md">
        {avatarUrl ? (
          <AvatarImage
            src={avatarUrl}
            alt={owner ?? ""}
            className="rounded-md"
          />
        ) : null}
        <AvatarFallback className="rounded-md text-[10px]">
          {(owner ?? "?").slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold leading-tight">
            {fullName}
          </span>
          {description ? (
            <span className="truncate text-xs text-muted-foreground">
              {description}
            </span>
          ) : null}
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-3 text-xs text-muted-foreground tabular-nums sm:flex">
        {hasStack ? (
          <DeviconStack languages={stackInput} max={2} size={14} />
        ) : null}
        <span className="flex items-center gap-1" title="Stars">
          <Star className="size-3" />
          {stars}
        </span>
        <span className="flex items-center gap-1" title="Forks">
          <GitFork className="size-3" />
          {forks}
        </span>
        <span className="flex items-center gap-1" title="Open issues">
          <CircleAlert className="size-3" />
          {openIssues}
        </span>
        <span className="text-[11px]">
          {new Date(pushedAt).toLocaleDateString()}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span
          className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium"
          aria-label={isPrivate ? "Private" : "Public"}
        >
          {isPrivate ? (
            <Lock className="size-2.5" />
          ) : (
            <Globe className="size-2.5" />
          )}
        </span>
        <PinButton fullName={fullName} pinned={pinned} />
      </div>
    </Link>
  );
}
