import Link from "next/link";
import { Star, GitFork, Lock, Globe, CircleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PinButton } from "./pin-button";

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
  return (
    <Link href={`/repositories/${fullName}`} className="group">
      <Card className="h-full transition-colors group-hover:border-foreground/20">
        <CardContent className="flex h-full flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold">{fullName}</p>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="gap-1 text-xs">
                {isPrivate ? <Lock className="size-3" /> : <Globe className="size-3" />}
                {isPrivate ? "Private" : "Public"}
              </Badge>
              <PinButton fullName={fullName} pinned={pinned} />
            </div>
          </div>
          <p className="line-clamp-2 min-h-[2.5rem] text-xs text-muted-foreground">
            {description ?? ""}
          </p>
          <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
            {language ? (
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-foreground/40" />
                {language}
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <Star className="size-3" />
              {stars}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="size-3" />
              {forks}
            </span>
            <span className="flex items-center gap-1">
              <CircleAlert className="size-3" />
              {openIssues}
            </span>
            <span className="ml-auto">
              {new Date(pushedAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
