"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LayoutPanelLeft, Columns3 } from "lucide-react";
import { toast } from "sonner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { setViewModeAction } from "@/app/actions/view-mode";
import type { RepoDetailViewMode } from "@/lib/preferences/get-user-preferences";

type Props = {
  owner: string;
  repo: string;
  current: RepoDetailViewMode;
};

export function RepoViewModeSwitcher({ owner, repo, current }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(next: string) {
    if (!next || next === current) return;
    if (next !== "tabs" && next !== "explorer") return;
    const mode = next as RepoDetailViewMode;

    startTransition(async () => {
      const res = await setViewModeAction("repoDetail", mode);
      if (!res.ok) {
        toast.error(res.error ?? "Failed to switch view");
        return;
      }
      const target =
        mode === "explorer"
          ? `/repositories/${owner}/${repo}/explorer`
          : `/repositories/${owner}/${repo}`;
      router.push(target);
      router.refresh();
    });
  }

  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={current}
      onValueChange={handleChange}
      disabled={isPending}
      aria-label="Repository view mode"
      className="hidden md:flex"
    >
      <ToggleGroupItem
        value="tabs"
        aria-label="Overview"
        className="data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
      >
        <LayoutPanelLeft className="size-4" />
        <span className="ml-1.5 hidden lg:inline">Overview</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="explorer"
        aria-label="Branches"
        className="data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
      >
        <Columns3 className="size-4" />
        <span className="ml-1.5 hidden lg:inline">Branches</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
