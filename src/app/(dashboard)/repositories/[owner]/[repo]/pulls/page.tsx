import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { Button } from "@/components/ui/button";
import { IssueList, type IssueLike } from "../../../_components/issue-list";

type SP = { state?: "open" | "closed" | "all"; page?: string };

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

  let items: IssueLike[] = [];
  try {
    const res = await githubService.listPullRequests(
      session.user.id,
      owner,
      repo,
      state,
      page,
    );
    items = res.data as IssueLike[];
  } catch {
    items = [];
  }

  return (
    <div className="flex flex-col gap-3">
      <StateTabs owner={owner} repo={repo} active={state} />
      <IssueList items={items} kind="pr" owner={owner} repo={repo} />
      <Pagination
        owner={owner}
        repo={repo}
        page={page}
        state={state}
        hasNext={items.length === 30}
      />
    </div>
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
