import Link from "next/link";
import { Star, GitFork, Lock, Globe, CircleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MagicCard } from "@/components/ui/magic-card";
import { PinButton } from "./pin-button";
import { DeviconBadge } from "@/components/devicon-badge";
import { getLanguageColor } from "@/lib/github/language-colors";

type RepoCardProps = {
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  isPrivate: boolean;
  pushedAt: string;
  pinned?: boolean;
};

export function RepoCard({
  fullName,
  description,
  language,
  stars,
  forks,
  openIssues,
  isPrivate,
  pushedAt,
  pinned = false,
}: RepoCardProps) {
  const [owner, name] = fullName.split("/");
  const avatarUrl = owner
    ? `https://github.com/${encodeURIComponent(owner)}.png?size=64`
    : undefined;
  const langColor = getLanguageColor(language);
  return (
    <Link
      href={`/repositories/${fullName}`}
      className="group block focus-visible:outline-none"
    >
      <Card className="h-full overflow-hidden border-none bg-transparent p-0 shadow-card transition-all group-hover:-translate-y-0.5 group-hover:shadow-card-hover group-focus-visible:ring-2 group-focus-visible:ring-ring">
      <MagicCard
        gradientFrom="var(--color-chart-1)"
        gradientTo="var(--color-chart-2)"
        gradientColor="color-mix(in oklch, var(--color-chart-1) 18%, transparent)"
        gradientSize={260}
        className="h-full rounded-xl p-0"
      >
        <CardContent className="flex h-full flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
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
              <div className="min-w-0">
                <p className="truncate text-xs leading-tight text-muted-foreground">
                  {owner}
                </p>
                <p className="truncate text-sm font-semibold leading-tight">
                  {name ?? fullName}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Badge
                variant="outline"
                className="gap-1 px-1.5 py-0 text-[10px] font-medium"
              >
                {isPrivate ? (
                  <Lock className="size-2.5" />
                ) : (
                  <Globe className="size-2.5" />
                )}
                {isPrivate ? "Private" : "Public"}
              </Badge>
              <PinButton fullName={fullName} pinned={pinned} />
            </div>
          </div>
          <p className="line-clamp-2 min-h-[2.5rem] text-xs text-muted-foreground">
            {description ?? ""}
          </p>
          <div className="mt-auto flex items-center gap-3 border-t pt-3 text-xs text-muted-foreground tabular-nums">
            {language ? (
              <span className="flex items-center gap-1.5">
                <DeviconBadge language={language} size={14} hideOnUnknown />
                <span
                  className="size-2.5 rounded-full ring-1 ring-border"
                  style={{ backgroundColor: langColor }}
                />
                <span className="text-foreground/80">{language}</span>
              </span>
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
            <span className="ml-auto text-[11px]">
              {new Date(pushedAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </MagicCard>
      </Card>
    </Link>
  );
}
