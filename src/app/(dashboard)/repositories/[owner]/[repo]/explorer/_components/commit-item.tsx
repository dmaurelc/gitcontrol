"use client";

import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/format/relative-time";
import type { RepoCommit } from "@/lib/github/service";
import { useExplorerState } from "./use-explorer-state";

type Props = {
  commit: RepoCommit;
};

export function CommitItem({ commit }: Props) {
  const { commit: selectedSha, setCommit } = useExplorerState();
  const active = commit.sha === selectedSha;
  const ref = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (active && ref.current) {
      ref.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [active]);

  const firstLine = commit.commit.message.split("\n")[0] ?? "";
  const date =
    commit.commit.author?.date ?? commit.commit.committer?.date ?? null;
  const relativeDate = relativeTime(date);
  const authorLogin = commit.author?.login ?? commit.commit.author?.name ?? "";
  const avatarUrl = commit.author?.avatar_url;

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setCommit(commit.sha)}
      className={cn(
        "flex w-full items-start gap-2 rounded-md border border-transparent px-3 py-2 text-left text-xs transition-colors",
        active
          ? "border-primary/40 bg-primary/5"
          : "hover:bg-accent/50",
      )}
    >
      <Avatar className="mt-0.5 size-5 shrink-0">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={authorLogin} />
        ) : null}
        <AvatarFallback className="text-[9px]">
          {(authorLogin || "?").slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{firstLine}</p>
        <p className="text-[10px] text-muted-foreground">
          {authorLogin}
          {relativeDate ? ` · ${relativeDate}` : ""}
        </p>
      </div>
      <code
        className={cn(
          "mt-0.5 text-[10px] font-mono",
          active ? "text-primary" : "text-primary/70",
        )}
      >
        {commit.sha.slice(0, 7)}
      </code>
    </button>
  );
}
