"use client";
import { useState, useTransition } from "react";
import { ChevronDown, GitMerge, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mergePullRequestAction } from "@/app/actions/pulls";

type MergeMethod = "merge" | "squash" | "rebase";

type Props = {
  owner: string;
  repo: string;
  number: number;
  headSha: string;
  defaultTitle: string;
  // Disable when GitHub says the PR can't be merged. The reason is shown
  // separately by the parent (mergeable badge / checks panel).
  disabled?: boolean;
};

const METHOD_LABEL: Record<MergeMethod, string> = {
  merge: "Create a merge commit",
  squash: "Squash and merge",
  rebase: "Rebase and merge",
};

export function MergePrButton({
  owner,
  repo,
  number,
  headSha,
  defaultTitle,
  disabled,
}: Props) {
  const [method, setMethod] = useState<MergeMethod>("merge");
  const [pending, startTransition] = useTransition();

  function submit(chosen: MergeMethod) {
    setMethod(chosen);
    const fd = new FormData();
    fd.set("owner", owner);
    fd.set("repo", repo);
    fd.set("number", String(number));
    fd.set("method", chosen);
    fd.set("sha", headSha);
    // Default merge-commit title mirrors GitHub's "<title> (#<n>)" so the
    // commit log stays readable. User can edit later from GitHub if needed.
    if (chosen !== "rebase") {
      fd.set("commitTitle", `${defaultTitle} (#${number})`);
    }
    startTransition(async () => {
      const res = await mergePullRequestAction(fd);
      if (res.ok) {
        toast.success(`PR mergeado (${METHOD_LABEL[chosen]})`);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="inline-flex">
      <Button
        type="button"
        disabled={disabled || pending}
        onClick={() => submit(method)}
        className="rounded-r-none"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <GitMerge className="size-4" />
        )}
        {pending ? "Merging…" : METHOD_LABEL[method]}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            disabled={disabled || pending}
            className="rounded-l-none border-l border-primary-foreground/20 px-2"
            aria-label="Choose merge method"
          >
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {(Object.keys(METHOD_LABEL) as MergeMethod[]).map((m) => (
            <DropdownMenuItem
              key={m}
              onSelect={() => setMethod(m)}
              className="flex flex-col items-start gap-0.5"
            >
              <span className="font-medium">{METHOD_LABEL[m]}</span>
              <span className="text-xs text-muted-foreground">
                {m === "merge"
                  ? "Conserva todos los commits + un commit de merge."
                  : m === "squash"
                    ? "Combina los commits en uno antes de mergear."
                    : "Reaplica los commits sin merge commit."}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
