"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BranchesList } from "./branches-list";
import { PrsList } from "./prs-list";
import { TagsList } from "./tags-list";
import { useExplorerState, type LeftTab } from "./use-explorer-state";
import type { RepoBranchRef, RepoTag } from "@/lib/github/service";
import type { ExplorerPr } from "./explorer-types";

type Props = {
  branches: RepoBranchRef[];
  prs: ExplorerPr[];
  tags: RepoTag[];
  defaultBranch: string | undefined;
};

export function LeftPanel({ branches, prs, tags, defaultBranch }: Props) {
  const { leftTab, setLeftTab } = useExplorerState();

  return (
    <Tabs
      value={leftTab}
      onValueChange={(v) => setLeftTab(v as LeftTab)}
      className="flex h-full flex-col"
    >
      <TabsList className="mx-3 mt-3 grid grid-cols-3">
        <TabsTrigger value="branches" className="text-xs">
          Branches
        </TabsTrigger>
        <TabsTrigger value="prs" className="text-xs">
          PRs
        </TabsTrigger>
        <TabsTrigger value="tags" className="text-xs">
          Tags
        </TabsTrigger>
      </TabsList>
      <TabsContent value="branches" className="mt-0 flex-1 overflow-hidden">
        <BranchesList branches={branches} defaultBranch={defaultBranch} />
      </TabsContent>
      <TabsContent value="prs" className="mt-0 flex-1 overflow-hidden px-1 pt-2">
        <PrsList prs={prs} />
      </TabsContent>
      <TabsContent value="tags" className="mt-0 flex-1 overflow-hidden px-1 pt-2">
        <TagsList tags={tags} />
      </TabsContent>
    </Tabs>
  );
}
