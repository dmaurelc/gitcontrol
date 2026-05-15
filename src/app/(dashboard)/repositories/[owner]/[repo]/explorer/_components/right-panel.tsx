"use client";

import { FileDiff } from "lucide-react";
import { useExplorerState } from "./use-explorer-state";

export function RightPanel() {
  const { commit } = useExplorerState();

  if (!commit) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
        <div className="grid size-10 place-items-center rounded-full bg-muted">
          <FileDiff className="size-4" />
        </div>
        <p className="font-medium text-foreground">No commit selected</p>
        <p className="text-xs">Pick a commit from the timeline to see changes.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Commit details
        </h2>
      </header>
      <div className="flex-1 overflow-y-auto p-4 text-xs">
        <p className="font-mono text-muted-foreground">{commit}</p>
        <p className="mt-3 rounded-md border border-dashed p-3 text-muted-foreground">
          Files, checks and PR panels arrive in phase 03.
        </p>
      </div>
    </div>
  );
}
