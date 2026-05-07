import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock, GitPullRequest } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { GithubError } from "@/lib/github/errors";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { IssueList, type IssueLike } from "../../../_components/issue-list";

type SP = { state?: "open" | "closed" | "all"; page?: string };

type LoadResult =
  | { kind: "ok"; items: IssueLike[] }
  | { kind: "forbidden" }
  | { kind: "not_found" }
  | { kind: "error"; message: string };

export default async function PullsPage({
  params,
  searchParams,
}: {
  params: Promise<{ owner: string; repo: string }>;
  searchParams: Promise<SP>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const { owner, repo } = await params;
  const sp = await searchParams;
  const state = sp.state ?? "open";
  const page = Math.max(1, Number(sp.page ?? "1"));

  const result = await loadPulls(session.user.id, owner, repo, state, page);

  if (result.kind !== "ok") {
    return (
      <div className="flex flex-col gap-3">
        <StateTabs owner={owner} repo={repo} active={state} />
        <PullsErrorState kind={result.kind} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <StateTabs owner={owner} repo={repo} active={state} />
      <IssueList items={result.items} kind="pr" owner={owner} repo={repo} />
      <Pagination
        owner={owner}
        repo={repo}
        page={page}
        state={state}
        hasNext={result.items.length === 30}
      />
    </div>
  );
}

async function loadPulls(
  userId: string,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all",
  page: number,
): Promise<LoadResult> {
  try {
    const res = await githubService.listPullRequests(
      userId,
      owner,
      repo,
      state,
      page,
    );
    return { kind: "ok", items: res.data as IssueLike[] };
  } catch (err) {
    if (err instanceof GithubError) {
      if (err.status === 403) return { kind: "forbidden" };
      if (err.status === 404) return { kind: "not_found" };
      return { kind: "error", message: err.message };
    }
    return { kind: "error", message: "Error al cargar pull requests." };
  }
}

function PullsErrorState({
  kind,
}: {
  kind: "forbidden" | "not_found" | "error";
}) {
  if (kind === "forbidden") {
    return (
      <EmptyState
        icon={Lock}
        title="Sin acceso a pull requests"
        description="No tienes permisos para ver pull requests en este repositorio. Pide acceso al propietario."
      />
    );
  }
  if (kind === "not_found") {
    return (
      <EmptyState
        icon={GitPullRequest}
        title="Pull requests no disponibles"
        description="Este repositorio no expone pull requests o no tienes acceso."
      />
    );
  }
  return (
    <EmptyState
      icon={GitPullRequest}
      title="No se pudieron cargar los pull requests"
      description="Hubo un problema al consultar GitHub. Intenta nuevamente en unos segundos."
    />
  );
}

function StateTabs({
  owner,
  repo,
  active,
}: {
  owner: string;
  repo: string;
  active: string;
}) {
  const opts = ["open", "closed", "all"] as const;
  return (
    <div className="flex items-center gap-2">
      {opts.map((s) => (
        <Button
          key={s}
          asChild
          size="sm"
          variant={s === active ? "default" : "outline"}
        >
          <Link href={`/repositories/${owner}/${repo}/pulls?state=${s}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        </Button>
      ))}
    </div>
  );
}

function Pagination({
  owner,
  repo,
  page,
  state,
  hasNext,
}: {
  owner: string;
  repo: string;
  page: number;
  state: string;
  hasNext: boolean;
}) {
  const base = `/repositories/${owner}/${repo}/pulls?state=${state}&page=`;
  return (
    <div className="flex items-center justify-end gap-2">
      <Button asChild variant="outline" size="sm" disabled={page <= 1}>
        <Link href={`${base}${Math.max(1, page - 1)}`}>Previous</Link>
      </Button>
      <span className="text-xs text-muted-foreground">Page {page}</span>
      <Button asChild variant="outline" size="sm" disabled={!hasNext}>
        <Link href={`${base}${page + 1}`}>Next</Link>
      </Button>
    </div>
  );
}
