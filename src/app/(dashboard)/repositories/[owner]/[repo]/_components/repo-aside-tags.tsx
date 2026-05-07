import { Tag, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { githubService } from "@/lib/github/service";
import type { RepoTag } from "@/lib/github/service";

type Props = {
  userId: string;
  owner: string;
  repo: string;
};

export async function RepoAsideTags({ userId, owner, repo }: Props) {
  let tags: RepoTag[] = [];
  try {
    const res = await githubService.listTags(userId, owner, repo, 6);
    tags = res.data;
  } catch {}

  return (
    <Card className="h-fit shadow-card">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="text-sm">Tags</CardTitle>
        <a
          href={`https://github.com/${owner}/${repo}/tags`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 text-[0.6875rem] text-muted-foreground transition-colors hover:text-foreground"
        >
          View all <ArrowUpRight className="size-3" />
        </a>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {tags.length === 0 ? (
          <p className="text-xs text-muted-foreground">No tags yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {tags.map((t) => (
              <li
                key={t.name}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <Tag className="size-3 shrink-0 text-muted-foreground" />
                  <span className="truncate font-mono">{t.name}</span>
                </span>
                <span className="shrink-0 font-mono text-[0.625rem] text-muted-foreground">
                  {t.commit.sha.slice(0, 7)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
