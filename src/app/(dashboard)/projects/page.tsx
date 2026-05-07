import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ExternalLink, KanbanSquare } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Projects"
        description="GitHub Projects v2 from your account."
      />
      {nodes.length === 0 ? (
        <EmptyState
          icon={KanbanSquare}
          title="No projects to show"
          description={
            <>
              Make sure your token has the{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                read:project
              </code>{" "}
              scope.
            </>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {nodes.map((p) => (
            <Card
              key={p.id}
              className="p-0 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <CardContent className="flex h-full flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.title}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      #{p.number}
                    </p>
                  </div>
                  {p.closed ? (
                    <Badge variant="secondary">Closed</Badge>
                  ) : (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-500">
                      Open
                    </Badge>
                  )}
                </div>
                <p className="line-clamp-3 min-h-12 text-xs text-muted-foreground">
                  {p.shortDescription ?? ""}
                </p>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto inline-flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
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
