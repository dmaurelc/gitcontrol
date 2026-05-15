import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/format/relative-time";
import {
  githubService,
  type CheckRunsResponse,
  type CommitAssociatedPr,
  type ExplorerCheckRun,
  type RepoCommitDetail,
} from "@/lib/github/service";
import { FileDiffItem } from "./file-diff-item";

type Props = {
  userId: string;
  owner: string;
  repo: string;
  sha: string;
};

function checkConclusionStyle(c: ExplorerCheckRun["conclusion"]) {
  switch (c) {
    case "success":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "failure":
    case "timed_out":
    case "action_required":
      return "bg-red-500/15 text-red-700 dark:text-red-300";
    case "cancelled":
    case "skipped":
    case "stale":
    case "neutral":
    case null:
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export async function CommitDetail({ userId, owner, repo, sha }: Props) {
  const [commitRes, checksRes, prsRes] = await Promise.allSettled([
    githubService.getCommitDetail(userId, owner, repo, sha),
    githubService.listChecksForRef(userId, owner, repo, sha),
    githubService.listPullsAssociatedWithCommit(userId, owner, repo, sha),
  ]);

  if (commitRes.status !== "fulfilled") {
    return (
      <div className="p-4 text-xs text-destructive">
        Failed to load commit {sha.slice(0, 7)}.
      </div>
    );
  }

  const commit: RepoCommitDetail = commitRes.value.data;
  const checks: CheckRunsResponse =
    checksRes.status === "fulfilled"
      ? checksRes.value.data
      : { total_count: 0, check_runs: [] };
  const prs: CommitAssociatedPr[] =
    prsRes.status === "fulfilled" ? prsRes.value.data : [];

  const firstLine = commit.commit.message.split("\n")[0] ?? "";
  const body = commit.commit.message.split("\n").slice(1).join("\n").trim();
  const authorName =
    commit.author?.login ?? commit.commit.author?.name ?? "unknown";
  const avatarUrl = commit.author?.avatar_url;
  const authorDate = commit.commit.author?.date ?? null;
  const files = commit.files ?? [];

  const checksPassed = checks.check_runs.filter(
    (c) => c.conclusion === "success",
  ).length;
  const checksFailed = checks.check_runs.filter(
    (c) =>
      c.conclusion === "failure" ||
      c.conclusion === "timed_out" ||
      c.conclusion === "action_required",
  ).length;
  const checksPending = checks.check_runs.filter(
    (c) => c.status !== "completed",
  ).length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="border-b p-4">
        <div className="flex items-start gap-3">
          <Avatar className="size-7">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={authorName} />
            ) : null}
            <AvatarFallback className="text-[10px]">
              {authorName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold leading-tight">{firstLine}</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {authorName}
              {authorDate ? ` · ${relativeTime(authorDate)}` : ""}
              {" · "}
              <a
                href={commit.html_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 hover:text-foreground"
              >
                <code className="font-mono">{commit.sha.slice(0, 7)}</code>
                <ExternalLink className="size-2.5" />
              </a>
            </p>
          </div>
        </div>
        {body ? (
          <pre className="mt-2 max-h-24 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted/40 p-2 text-[11px] text-muted-foreground">
            {body}
          </pre>
        ) : null}
      </header>

      <Tabs defaultValue="files" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-3 mt-3 grid grid-cols-3">
          <TabsTrigger value="files" className="text-xs">
            Files ({files.length})
          </TabsTrigger>
          <TabsTrigger value="checks" className="text-xs">
            Checks ({checks.total_count})
          </TabsTrigger>
          <TabsTrigger value="pr" className="text-xs" disabled={prs.length === 0}>
            {prs.length > 0 ? `PR #${prs[0].number}` : "PR"}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="files"
          className="mt-2 flex-1 overflow-y-auto px-3 pb-3"
        >
          {files.length === 0 ? (
            <p className="py-4 text-xs italic text-muted-foreground">
              No file changes (merge or empty commit).
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {files.map((f, i) => (
                <li key={`${f.filename}-${i}`}>
                  <FileDiffItem file={f} defaultOpen={files.length <= 3} />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent
          value="checks"
          className="mt-2 flex-1 overflow-y-auto px-3 pb-3"
        >
          {checks.check_runs.length === 0 ? (
            <p className="py-4 text-xs italic text-muted-foreground">
              No checks reported for this commit.
            </p>
          ) : (
            <>
              <div className="mb-2 flex gap-3 text-[11px] text-muted-foreground">
                {checksPassed > 0 ? (
                  <span className="text-emerald-500">{checksPassed} passed</span>
                ) : null}
                {checksFailed > 0 ? (
                  <span className="text-red-500">{checksFailed} failed</span>
                ) : null}
                {checksPending > 0 ? (
                  <span className="text-amber-500">{checksPending} pending</span>
                ) : null}
              </div>
              <ul className="flex flex-col gap-1.5">
                {checks.check_runs.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs"
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-5 shrink-0 border-transparent px-1.5 text-[10px]",
                        checkConclusionStyle(c.conclusion),
                      )}
                    >
                      {c.conclusion ?? c.status}
                    </Badge>
                    <span className="truncate">{c.name}</span>
                    {c.html_url ? (
                      <a
                        href={c.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        Details <ExternalLink className="size-2.5" />
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          )}
        </TabsContent>

        <TabsContent
          value="pr"
          className="mt-2 flex-1 overflow-y-auto px-3 pb-3"
        >
          {prs.length === 0 ? (
            <p className="py-4 text-xs italic text-muted-foreground">
              This commit isn&apos;t linked to a pull request.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {prs.map((pr) => (
                <li
                  key={pr.number}
                  className="rounded-md border p-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      #{pr.number}
                    </Badge>
                    <span className="truncate font-medium">{pr.title}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {pr.head.ref} → {pr.base.ref}
                    {pr.merged_at ? " · merged" : ` · ${pr.state}`}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Link
                      href={`/repositories/${owner}/${repo}/pulls/${pr.number}`}
                      className="text-[11px] underline-offset-2 hover:underline"
                    >
                      Open in tabs view
                    </Link>
                    <a
                      href={pr.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      GitHub <ExternalLink className="size-2.5" />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
