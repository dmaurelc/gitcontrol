import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { githubService } from "@/lib/github/service";
import type { RepoContributor } from "@/lib/github/service";

type Props = {
  userId: string;
  owner: string;
  repo: string;
};

export async function RepoAsideContributors({ userId, owner, repo }: Props) {
  let contributors: RepoContributor[] = [];
  try {
    const res = await githubService.listContributors(userId, owner, repo, 8);
    contributors = res.data;
  } catch {}

  return (
    <Card className="h-fit shadow-card">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="text-sm">Contributors</CardTitle>
        <a
          href={`https://github.com/${owner}/${repo}/graphs/contributors`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 text-[0.6875rem] text-muted-foreground transition-colors hover:text-foreground"
        >
          View all <ArrowUpRight className="size-3" />
        </a>
      </CardHeader>
      <CardContent>
        {contributors.length === 0 ? (
          <p className="text-xs text-muted-foreground">No data.</p>
        ) : (
          <ul className="grid grid-cols-4 gap-2">
            {contributors.map((c) => (
              <li key={c.id}>
                <a
                  href={c.html_url}
                  target="_blank"
                  rel="noreferrer"
                  title={`${c.login} — ${c.contributions} commit${c.contributions !== 1 ? "s" : ""}`}
                  className="block transition-transform hover:-translate-y-0.5"
                >
                  <Avatar className="size-10">
                    <AvatarImage src={c.avatar_url} alt={c.login} />
                    <AvatarFallback className="text-[0.625rem]">
                      {c.login.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
