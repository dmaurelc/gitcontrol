import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProjectsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  let nodes: Array<{
    id: string;
    title: string;
    number: number;
    shortDescription: string | null;
    url: string;
    closed: boolean;
  }> = [];
  try {
    const res = await githubService.listProjectsV2ForViewer(session.user.id);
    nodes = res.data;
  } catch {
    nodes = [];
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">
          GitHub Projects v2 from your account.
        </p>
      </div>
      {nodes.length === 0 ? (
        <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          No projects to show. Make sure your token has the
          <code className="mx-1 rounded bg-muted px-1 py-0.5">read:project</code>
          scope.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {nodes.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex h-full flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.title}</p>
                    <p className="text-xs text-muted-foreground">#{p.number}</p>
                  </div>
                  {p.closed ? (
                    <Badge variant="secondary">Closed</Badge>
                  ) : (
                    <Badge variant="outline">Open</Badge>
                  )}
                </div>
                <p className="line-clamp-3 min-h-12 text-xs text-muted-foreground">
                  {p.shortDescription ?? ""}
                </p>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto flex items-center gap-1 text-xs text-foreground hover:underline"
                >
                  Open on GitHub <ExternalLink className="size-3" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
