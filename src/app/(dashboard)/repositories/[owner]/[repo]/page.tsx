import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RepoOverviewPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const { owner, repo } = await params;

  let readme: string | null = null;
  try {
    const r = await githubService.getReadme(session.user.id, owner, repo);
    if (r.data.encoding === "base64") {
      readme = Buffer.from(r.data.content, "base64").toString("utf8");
    } else {
      readme = r.data.content;
    }
  } catch {
    readme = null;
  }

  let langs: Record<string, number> = {};
  try {
    const l = await githubService.listLanguages(session.user.id, owner, repo);
    langs = l.data;
  } catch {
    // ignore
  }
  const langTotal = Object.values(langs).reduce((a, b) => a + b, 0);
  const langEntries = Object.entries(langs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">README</CardTitle>
        </CardHeader>
        <CardContent>
          {readme ? (
            <article className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
              >
                {readme}
              </ReactMarkdown>
            </article>
          ) : (
            <p className="text-sm text-muted-foreground">
              No README available.
            </p>
          )}
        </CardContent>
      </Card>
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Languages</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {langTotal === 0 ? (
            <p className="text-sm text-muted-foreground">No data.</p>
          ) : (
            langEntries.map(([name, bytes]) => {
              const pct = (bytes / langTotal) * 100;
              return (
                <div key={name} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{name}</span>
                    <span className="text-muted-foreground">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-foreground/70"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
