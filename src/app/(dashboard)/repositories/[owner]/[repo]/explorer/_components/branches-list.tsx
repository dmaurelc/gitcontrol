"use client";

import { useMemo, useState } from "react";
import { GitBranch, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RepoBranchRef } from "@/lib/github/service";
import { useExplorerState } from "./use-explorer-state";

type Props = {
  branches: RepoBranchRef[];
  defaultBranch: string | undefined;
};

export function BranchesList({ branches, defaultBranch }: Props) {
  const { branch: selected, setBranch } = useExplorerState();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter((b) => b.name.toLowerCase().includes(q));
  }, [branches, query]);

  const activeName = selected || defaultBranch || "";

  return (
    <div className="flex h-full flex-col">
      <div className="relative px-3 pt-3 pb-2">
        <Search className="pointer-events-none absolute left-5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter branches"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 pl-7 text-xs"
          aria-label="Filter branches"
        />
      </div>
      <ul className="flex-1 overflow-y-auto px-1 pb-2">
        {filtered.length === 0 ? (
          <li className="px-3 py-4 text-xs text-muted-foreground">
            No branches match.
          </li>
        ) : (
          filtered.map((b) => {
            const active = b.name === activeName;
            return (
              <li key={b.name}>
                <button
                  type="button"
                  onClick={() => setBranch(b.name)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50",
                  )}
                >
                  <GitBranch className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate font-mono">{b.name}</span>
                  {b.name === defaultBranch ? (
                    <Badge variant="outline" className="ml-auto h-4 px-1 text-[10px]">
                      default
                    </Badge>
                  ) : null}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
