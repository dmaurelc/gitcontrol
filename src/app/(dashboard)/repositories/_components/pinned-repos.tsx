import { Pin } from "lucide-react";
import { githubService } from "@/lib/github/service";
import { Card, CardContent } from "@/components/ui/card";
import { RepoCard } from "./repo-card";
import { PinButton } from "./pin-button";

export async function PinnedRepos({
  pinned,
  userId,
}: {
  pinned: string[];
  userId: string;
}) {
  // Fetch each pinned repo + its language breakdown in parallel; tolerate
  // failures (lost access, etc.). The languages call is cached for 1h so
  // it's effectively free on repeat renders.
  const settled = await Promise.allSettled(
    pinned.map((p) => {
      const [owner, name] = p.split("/");
      return githubService.getRepo(userId, owner, name);
    }),
  );
  const languagesByRepo = await Promise.all(
    pinned.map(async (p, i) => {
      const [owner, name] = p.split("/");
      try {
        const res = await githubService.getLanguages(userId, owner, name);
        const data = res.data;
        if (Object.keys(data).length === 0) {
          const r = settled[i];
          if (r.status === "fulfilled" && r.value.data.language) {
            return { [r.value.data.language]: 1 };
          }
        }
        return data;
      } catch {
        return {} as Record<string, number>;
      }
    }),
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="grid size-6 place-items-center rounded-md bg-chart-4/15 text-chart-4">
          <Pin className="size-3" />
        </div>
        <h2 className="text-sm font-semibold">Pinned</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {pinned.length}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {settled.map((r, i) => {
          const fullName = pinned[i];
          if (r.status !== "fulfilled") {
            return (
              <Card
                key={fullName}
                className="border-destructive/30 bg-destructive/5 p-0"
              >
                <CardContent className="flex h-full flex-col gap-2 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{fullName}</p>
                    <PinButton fullName={fullName} pinned />
                  </div>
                  <p className="text-xs text-destructive">
                    Repository unavailable (deleted or access lost).
                  </p>
                </CardContent>
              </Card>
            );
          }
          const d = r.value.data as typeof r.value.data & {
            archived?: boolean;
          };
          return (
            <RepoCard
              key={d.id}
              fullName={d.full_name}
              description={d.description}
              language={d.language}
              languages={languagesByRepo[i]}
              stars={d.stargazers_count}
              forks={d.forks_count}
              openIssues={d.open_issues_count}
              isPrivate={d.private}
              pushedAt={d.pushed_at}
              archived={d.archived}
              pinned
            />
          );
        })}
      </div>
    </section>
  );
}
