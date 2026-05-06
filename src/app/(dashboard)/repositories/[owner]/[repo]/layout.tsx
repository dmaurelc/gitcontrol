import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  Star,
  GitFork,
  CircleAlert,
  Lock,
  Globe,
  ExternalLink,
} from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { Badge } from "@/components/ui/badge";
import { RepoTabsNav } from "../../_components/repo-tabs-nav";

export default async function RepoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ owner: string; repo: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const { owner, repo } = await params;

  let header: {
    fullName: string;
    description: string | null;
    isPrivate: boolean;
    stars: number;
    forks: number;
    openIssues: number;
    htmlUrl: string;
  } | null = null;
  try {
    const r = await githubService.getRepo(session.user.id, owner, repo);
    header = {
      fullName: r.data.full_name,
      description: r.data.description,
      isPrivate: r.data.private,
      stars: r.data.stargazers_count,
      forks: r.data.forks_count,
      openIssues: r.data.open_issues_count,
      htmlUrl: (r.data as unknown as { html_url: string }).html_url,
    };
  } catch {
    return (
      <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
        Repository not found or access denied.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="/repositories"
            className="hover:text-foreground"
          >
            Repositories
          </Link>
          <span>/</span>
          <span className="text-foreground">{header.fullName}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {header.fullName}
          </h1>
          <Badge variant="outline" className="gap-1">
            {header.isPrivate ? (
              <Lock className="size-3" />
            ) : (
              <Globe className="size-3" />
            )}
            {header.isPrivate ? "Private" : "Public"}
          </Badge>
          <a
            href={header.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            View on GitHub <ExternalLink className="size-3" />
          </a>
        </div>
        {header.description ? (
          <p className="text-sm text-muted-foreground">{header.description}</p>
        ) : null}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="size-3" />
            {header.stars}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="size-3" />
            {header.forks}
          </span>
          <span className="flex items-center gap-1">
            <CircleAlert className="size-3" />
            {header.openIssues}
          </span>
        </div>
      </div>
      <RepoTabsNav owner={owner} repo={repo} />
      <div>{children}</div>
    </div>
  );
}
