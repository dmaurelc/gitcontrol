"use client";

import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RepoTag } from "@/lib/github/service";
import { useExplorerState } from "./use-explorer-state";

type Props = {
  tags: RepoTag[];
};

export function TagsList({ tags }: Props) {
  const { commit: selectedCommit, setCommit } = useExplorerState();

  if (tags.length === 0) {
    return (
      <p className="px-3 py-6 text-xs text-muted-foreground">No tags yet.</p>
    );
  }

  return (
    <ul className="flex-1 overflow-y-auto px-1 pb-2">
      {tags.map((t) => {
        const active = t.commit.sha === selectedCommit;
        return (
          <li key={t.name}>
            <button
              type="button"
              onClick={() => setCommit(t.commit.sha)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50",
              )}
            >
              <Tag className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate font-mono">{t.name}</span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                {t.commit.sha.slice(0, 7)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
