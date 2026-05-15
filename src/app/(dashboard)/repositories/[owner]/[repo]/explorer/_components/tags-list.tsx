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
      <p className="px-3 py-6 text-sm text-muted-foreground">No tags yet.</p>
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
                "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-accent/50",
              )}
            >
              <Tag
                className={cn(
                  "size-4 shrink-0",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span className="truncate font-mono">{t.name}</span>
              <span className="ml-auto font-mono text-xs text-primary/80">
                {t.commit.sha.slice(0, 7)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
