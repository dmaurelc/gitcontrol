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
  // Fetch each pinned repo in parallel; tolerate failures (lost access).
  const settled = await Promise.allSettled(
    pinned.map((p) => {
      const [owner, name] = p.split("/");
      return githubService.getRepo(userId, owner, name);
    }),
  );

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Pin className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Pinned</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {settled.map((r, i) => {
          const fullName = pinned[i];
          if (r.status !== "fulfilled") {
            return (
              <Card key={fullName} className="border-foreground/30">
                <CardContent className="flex h-full flex-col gap-2 p-4">
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
          const d = r.value.data;
          return (
            <RepoCard
              key={d.id}
              fullName={d.full_name}
              description={d.description}
              language={d.language}
              stars={d.stargazers_count}
              forks={d.forks_count}
              openIssues={d.open_issues_count}
              isPrivate={d.private}
              pushedAt={d.pushed_at}
              pinned
            />
          );
        })}
      </div>
    </section>
  );
}
