"use client";

import { useMemo } from "react";
import { GitPullRequest, GitPullRequestDraft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ExplorerPr } from "./explorer-types";
import { useExplorerState } from "./use-explorer-state";

type Props = {
  prs: ExplorerPr[];
};

export function PrsList({ prs }: Props) {
  const { branch: selectedBranch, setBranch } = useExplorerState();

  const items = useMemo(() => prs.filter((p) => p && p.head?.ref), [prs]);

  if (items.length === 0) {
    return (
      <p className="px-3 py-6 text-xs text-muted-foreground">
        No open pull requests.
      </p>
    );
  }

  return (
    <ul className="flex-1 overflow-y-auto px-1 pb-2">
      {items.map((pr) => {
        const active = pr.head.ref === selectedBranch;
        const Icon = pr.draft ? GitPullRequestDraft : GitPullRequest;
        return (
          <li key={pr.number}>
            <button
              type="button"
              onClick={() => setBranch(pr.head.ref)}
              className={cn(
                "flex w-full flex-col gap-1 rounded-md px-2 py-2 text-left text-xs transition-colors",
                active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
              )}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className={cn(
                    "size-3.5 shrink-0",
                    pr.draft ? "text-muted-foreground" : "text-emerald-500",
                  )}
                />
                <span className="truncate font-medium">{pr.title}</span>
              </div>
              <div className="flex items-center gap-1.5 pl-5 text-[10px] text-muted-foreground">
                {pr.user ? (
                  <Avatar className="size-3.5">
                    <AvatarImage src={pr.user.avatar_url} alt={pr.user.login} />
                    <AvatarFallback className="text-[8px]">
                      {pr.user.login.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : null}
                <span>#{pr.number}</span>
                <span className="truncate">· {pr.head.ref}</span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
