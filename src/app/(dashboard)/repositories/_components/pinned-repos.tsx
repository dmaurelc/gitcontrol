import Link from "next/link";
import { Pin, ExternalLink } from "lucide-react";
import { githubService } from "@/lib/github/service";
import { Card, CardContent } from "@/components/ui/card";

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
  const items = settled
    .map((r, i) => {
      if (r.status !== "fulfilled") {
        return { fullName: pinned[i], unavailable: true } as const;
      }
      const d = r.value.data;
      return {
        fullName: d.full_name,
        description: d.description,
        language: d.language,
        stars: d.stargazers_count,
        unavailable: false,
      } as const;
    });

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Pin className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Pinned</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((it) => (
          <Card key={it.fullName} className="border-foreground/30">
            <CardContent className="flex h-full flex-col gap-2 p-4">
              {it.unavailable ? (
                <>
                  <p className="truncate text-sm font-semibold">{it.fullName}</p>
                  <p className="text-xs text-destructive">
                    Repository unavailable (deleted or access lost).
                  </p>
                </>
              ) : (
                <>
                  <Link
                    href={`/repositories/${it.fullName}`}
                    className="flex items-center justify-between gap-2 text-sm font-semibold hover:underline"
                  >
                    <span className="truncate">{it.fullName}</span>
                    <ExternalLink className="size-3" />
                  </Link>
                  <p className="line-clamp-2 min-h-10 text-xs text-muted-foreground">
                    {it.description ?? ""}
                  </p>
                  <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
                    {it.language ? <span>{it.language}</span> : null}
                    <span>★ {it.stars}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
