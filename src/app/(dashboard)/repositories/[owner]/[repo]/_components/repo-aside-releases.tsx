import { Rocket, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { githubService } from "@/lib/github/service";
import type { RepoRelease } from "@/lib/github/service";

type Props = {
  userId: string;
  owner: string;
  repo: string;
};

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (d < 1) return "today";
  if (d < 7) return `${d}d`;
  if (d < 30) return `${Math.floor(d / 7)}w`;
  if (d < 365) return `${Math.floor(d / 30)}mo`;
  return `${Math.floor(d / 365)}y`;
}

export async function RepoAsideReleases({ userId, owner, repo }: Props) {
  let releases: RepoRelease[] = [];
  try {
    const res = await githubService.listReleases(userId, owner, repo, 6);
    releases = res.data;
  } catch {}

  return (
    <Card className="h-fit shadow-card">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="text-sm">Releases</CardTitle>
        <a
          href={`https://github.com/${owner}/${repo}/releases`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 text-[0.6875rem] text-muted-foreground transition-colors hover:text-foreground"
        >
          View all <ArrowUpRight className="size-3" />
        </a>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {releases.length === 0 ? (
          <p className="text-xs text-muted-foreground">No releases yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {releases.map((r) => (
              <li key={r.id}>
                <a
                  href={r.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col gap-0.5 rounded-md py-1 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-1.5">
                    <Rocket className="size-3 shrink-0 text-muted-foreground" />
                    <span className="truncate text-xs font-medium">
                      {r.name?.trim() || r.tag_name}
                    </span>
                    {r.draft ? (
                      <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[0.6rem] uppercase text-muted-foreground">
                        draft
                      </span>
                    ) : null}
                    {r.prerelease ? (
                      <span className="shrink-0 rounded bg-amber-500/15 px-1 py-0.5 text-[0.6rem] uppercase text-amber-600 dark:text-amber-400">
                        pre
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 pl-4.5 text-[0.6875rem] text-muted-foreground">
                    <span className="font-mono">{r.tag_name}</span>
                    <span aria-hidden>·</span>
                    <span>{relativeTime(r.published_at ?? r.created_at)}</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
