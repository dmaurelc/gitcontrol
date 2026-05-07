import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock, CircleDot } from "lucide-react";
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

export default async function IssuesPage({
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

  const result = await loadIssues(session.user.id, owner, repo, state, page);

  if (result.kind !== "ok") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <StateTabs owner={owner} repo={repo} active={state} />
        </div>
        <IssuesErrorState kind={result.kind} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <StateTabs owner={owner} repo={repo} active={state} />
        <Button asChild size="sm">
          <Link href={`/repositories/${owner}/${repo}/issues/new`}>
            New issue
          </Link>
        </Button>
      </div>
      <IssueList items={result.items} kind="issue" owner={owner} repo={repo} />
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

async function loadIssues(
  userId: string,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all",
  page: number,
): Promise<LoadResult> {
  try {
    const res = await githubService.listIssues(userId, owner, repo, state, page);
    // GitHub's issues endpoint also returns PRs; filter them out.
    const items = (res.data as IssueLike[]).filter((i) => !i.pull_request);
    return { kind: "ok", items };
  } catch (err) {
    if (err instanceof GithubError) {
      if (err.status === 403) return { kind: "forbidden" };
      if (err.status === 404) return { kind: "not_found" };
      return { kind: "error", message: err.message };
    }
    return { kind: "error", message: "Error al cargar issues." };
  }
}

function IssuesErrorState({
  kind,
}: {
  kind: "forbidden" | "not_found" | "error";
}) {
  if (kind === "forbidden") {
    return (
      <EmptyState
        icon={Lock}
        title="Sin acceso a issues"
        description="No tienes permisos para ver issues en este repositorio. Pide acceso al propietario."
      />
    );
  }
  if (kind === "not_found") {
    return (
      <EmptyState
        icon={CircleDot}
        title="Issues no disponibles"
        description="Este repositorio tiene los issues deshabilitados o no tienes acceso."
      />
    );
  }
  return (
    <EmptyState
      icon={CircleDot}
      title="No se pudieron cargar los issues"
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
          <Link href={`/repositories/${owner}/${repo}/issues?state=${s}`}>
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
  const base = `/repositories/${owner}/${repo}/issues?state=${state}&page=`;
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
