"use client";

import { GitCommit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import type { RepoCommit } from "@/lib/github/service";
import { CommitItem } from "./commit-item";
import { useExplorerState } from "./use-explorer-state";

type Props = {
  commits: RepoCommit[];
  branchName: string;
  error: string | null;
  hasMore: boolean;
};

export function CommitsPanel({ commits, branchName, error, hasMore }: Props) {
  const { page, setPage } = useExplorerState();

  return (
    <div className="flex h-full flex-col">
      <header className="border-b px-4 py-2.5">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <GitCommit className="size-3.5 text-primary" />
          Commits
          {branchName ? (
            <span className="font-mono text-[10px] normal-case tracking-normal text-primary/80">
              · {branchName}
            </span>
          ) : null}
        </h2>
      </header>
      <div className="flex-1 overflow-y-auto p-1.5">
        {error ? (
          <div className="p-4 text-xs text-destructive">{error}</div>
        ) : commits.length === 0 ? (
          <EmptyState
            icon={GitCommit}
            title="No commits"
            description={
              branchName
                ? `No commits found on ${branchName}.`
                : "Select a branch to see commits."
            }
          />
        ) : (
          <ul className="flex flex-col gap-0.5">
            {commits.map((c) => (
              <li key={c.sha}>
                <CommitItem commit={c} />
              </li>
            ))}
          </ul>
        )}
      </div>
      {commits.length > 0 ? (
        <footer className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
          <span>Page {page}</span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={!hasMore}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
