import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock, CircleDot } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { GithubError } from "@/lib/github/errors";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PaginationNav } from "@/components/pagination-nav";
import { PerPageSelect } from "@/components/per-page-select";
import { clampPerPage } from "@/lib/pagination/per-page";
import { IssueList, type IssueLike } from "../../../_components/issue-list";

type SP = {
  state?: "open" | "closed" | "all";
  page?: string;
  perPage?: string;
};

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
  if (!session) redirect("/");
  const { owner, repo } = await params;
  const sp = await searchParams;
  const state = sp.state ?? "open";
  const page = Math.max(1, Number(sp.page ?? "1"));
  const perPage = clampPerPage(sp.perPage);

  const basePath = `/repositories/${owner}/${repo}/issues`;

  const result = await loadIssues(
    session.user.id,
    owner,
    repo,
    state,
    page,
    perPage,
  );

  if (result.kind !== "ok") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card/50 p-3 shadow-soft">
          <StateTabs owner={owner} repo={repo} active={state} />
        </div>
        <IssuesErrorState kind={result.kind} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card/50 p-3 shadow-soft">
        <StateTabs owner={owner} repo={repo} active={state} />
        <div className="flex items-center gap-2">
          <PerPageSelect basePath={basePath} />
          <Button asChild size="sm">
            <Link href={`${basePath}/new`}>New issue</Link>
          </Button>
        </div>
      </div>
      <IssueList items={result.items} kind="issue" owner={owner} repo={repo} />
      <PaginationNav
        basePath={basePath}
        page={page}
        hasNext={result.items.length === perPage}
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
  perPage: number,
): Promise<LoadResult> {
  try {
    const res = await githubService.listIssues(
      userId,
      owner,
      repo,
      state,
      page,
      perPage,
    );
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
