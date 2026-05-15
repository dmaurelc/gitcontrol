"use client";

import type { RepoBranchRef } from "@/lib/github/service";
import { CreateBranchDialog } from "./create-branch-dialog";
import { EditFileDialog } from "./edit-file-dialog";
import { CreatePrDialog } from "./create-pr-dialog";

type Props = {
  owner: string;
  repo: string;
  branches: RepoBranchRef[];
  defaultBranch: string | undefined;
  currentBranch: string;
  hasCommitsAhead: boolean;
  defaultPrTitle?: string;
};

// Toolbar shown above the commits panel with the explorer's edit affordances.
// Each dialog is self-contained; this component only composes them.
export function ExplorerEditToolbar({
  owner,
  repo,
  branches,
  defaultBranch,
  currentBranch,
  hasCommitsAhead,
  defaultPrTitle,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
      <div className="w-36">
        <CreateBranchDialog
          owner={owner}
          repo={repo}
          branches={branches}
          defaultBranch={defaultBranch}
        />
      </div>
      <EditFileDialog
        owner={owner}
        repo={repo}
        branches={branches}
        currentBranch={currentBranch}
      />
      {hasCommitsAhead && defaultBranch && currentBranch !== defaultBranch ? (
        <CreatePrDialog
          owner={owner}
          repo={repo}
          branches={branches}
          headBranch={currentBranch}
          defaultBranch={defaultBranch}
          defaultTitle={defaultPrTitle}
        />
      ) : null}
    </div>
  );
}
