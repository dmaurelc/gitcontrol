import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Star } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type StarRow = {
  starred_at: string;
  repo: {
    id: number;
    full_name: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    html_url: string;
  };
};

export default async function StarsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1"));

  let items: StarRow[] = [];
  try {
    const res = await githubService.listStars(session.user.id, page);
    items = res.data as unknown as StarRow[];
  } catch {
    items = [];
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stars</h1>
        <p className="text-sm text-muted-foreground">
          Repositories you have starred.
        </p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          You have not starred any repositories yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((s) => (
            <Card key={s.repo.id}>
              <CardContent className="flex h-full flex-col gap-2 p-4">
                <a
                  href={s.repo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-sm font-semibold hover:underline"
                >
                  {s.repo.full_name}
                </a>
                <p className="line-clamp-2 min-h-[2.5rem] text-xs text-muted-foreground">
                  {s.repo.description ?? ""}
                </p>
                <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
                  {s.repo.language ? <span>{s.repo.language}</span> : null}
                  <span className="flex items-center gap-1">
                    <Star className="size-3" />
                    {s.repo.stargazers_count}
                  </span>
                  <span className="ml-auto">
                    Starred {new Date(s.starred_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button asChild variant="outline" size="sm" disabled={page <= 1}>
          <Link href={`/stars?page=${Math.max(1, page - 1)}`}>Previous</Link>
        </Button>
        <span className="text-xs text-muted-foreground">Page {page}</span>
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={items.length < 30}
        >
          <Link href={`/stars?page=${page + 1}`}>Next</Link>
        </Button>
      </div>
    </div>
  );
}
