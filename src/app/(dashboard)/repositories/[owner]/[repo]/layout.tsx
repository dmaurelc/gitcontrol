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
import { GitBranch } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/empty-state";
import { RepoTabsNav } from "../../_components/repo-tabs-nav";
import {
  getUserPreferences,
  readRepoDetailViewMode,
} from "@/lib/preferences/get-user-preferences";
import { RepoViewModeSwitcher } from "./_components/repo-view-mode-switcher";

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

  const prefs = await getUserPreferences(session.user.id);
  const viewMode = readRepoDetailViewMode(prefs.filters);

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
      <EmptyState
        icon={GitBranch}
        title="Repository not found"
        description="The repo doesn't exist or your token can't see it."
      />
    );
  }

  const avatarUrl = `https://github.com/${encodeURIComponent(owner)}.png?size=80`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link
            href="/repositories"
            className="transition-colors hover:text-foreground"
          >
            Repositories
          </Link>
          <span>/</span>
          <span className="text-foreground">{owner}</span>
          <span>/</span>
          <span className="font-medium text-foreground">{repo}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Avatar className="size-10 rounded-lg">
            <AvatarImage src={avatarUrl} alt={owner} className="rounded-lg" />
            <AvatarFallback className="rounded-lg text-xs">
              {owner.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
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
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View on GitHub <ExternalLink className="size-3" />
              </a>
            </div>
            {header.description ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {header.description}
              </p>
            ) : null}
          </div>
          <RepoViewModeSwitcher
            owner={owner}
            repo={repo}
            current={viewMode}
          />
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground tabular-nums">
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
      {viewMode === "tabs" ? <RepoTabsNav owner={owner} repo={repo} /> : null}
      <div>{children}</div>
    </div>
  );
}
