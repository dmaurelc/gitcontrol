import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GitBranch } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { EmptyState } from "@/components/empty-state";
import { FileBreadcrumbs } from "./_components/file-breadcrumbs";
import { FileTree } from "./_components/file-tree";
import { FilePreview } from "./_components/file-preview";

type SearchParams = { path?: string; ref?: string };

export default async function RepoFilesPage({
  params,
  searchParams,
}: {
  params: Promise<{ owner: string; repo: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const { owner, repo } = await params;
  const sp = await searchParams;
  const rawPath = sp.path?.replace(/^\/+|\/+$/g, "") ?? "";
  const ref = sp.ref;

  // Default branch lookup; tolerate failure (private repos token can't see).
  let defaultBranch: string | undefined;
  try {
    const r = await githubService.getRepo(session.user.id, owner, repo);
    defaultBranch = r.data.default_branch;
  } catch {}
  const effectiveRef = ref ?? defaultBranch;

  let body: Awaited<ReturnType<typeof githubService.getContent>>["data"] | null = null;
  let error: string | null = null;
  try {
    const res = await githubService.getContent(
      session.user.id,
      owner,
      repo,
      rawPath,
      effectiveRef,
    );
    body = res.data;
  } catch (err) {
    const e = err as { message?: string; status?: number };
    error = e.message ?? "Unable to load contents.";
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FileBreadcrumbs owner={owner} repo={repo} path={rawPath} />
        {effectiveRef ? (
          <span className="inline-flex items-center gap-1 rounded border bg-background px-2 py-0.5 font-mono text-[0.6875rem] text-muted-foreground">
            <GitBranch className="size-3" />
            {effectiveRef}
          </span>
        ) : null}
      </div>

      {error ? (
        <EmptyState
          icon={GitBranch}
          title="Couldn't load files"
          description={error}
        />
      ) : body === null ? (
        <EmptyState
          icon={GitBranch}
          title="Empty repository"
          description="This repository has no files yet."
        />
      ) : body.kind === "dir" ? (
        <FileTree
          owner={owner}
          repo={repo}
          parentPath={rawPath}
          entries={body.entries}
        />
      ) : (
        <FilePreview file={body.file} />
      )}
    </div>
  );
}
