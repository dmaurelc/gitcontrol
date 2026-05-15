"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

export type LeftTab = "branches" | "prs" | "tags";

const VALID_LEFT_TABS: LeftTab[] = ["branches", "prs", "tags"];

export function useExplorerState() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const branch = params.get("branch") ?? "";
  const commit = params.get("commit") ?? "";
  const leftTabParam = params.get("leftTab") ?? "branches";
  const leftTab: LeftTab = VALID_LEFT_TABS.includes(leftTabParam as LeftTab)
    ? (leftTabParam as LeftTab)
    : "branches";
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);

  const update = useCallback(
    (next: Record<string, string | null>) => {
      const sp = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value === null || value === "") sp.delete(key);
        else sp.set(key, value);
      }
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const setBranch = useCallback(
    (name: string) => update({ branch: name, commit: null, page: null }),
    [update],
  );
  const setCommit = useCallback((sha: string) => update({ commit: sha }), [update]);
  const setLeftTab = useCallback((tab: LeftTab) => update({ leftTab: tab }), [update]);
  const setPage = useCallback((p: number) => update({ page: String(p) }), [update]);

  return {
    branch,
    commit,
    leftTab,
    page,
    setBranch,
    setCommit,
    setLeftTab,
    setPage,
  };
}
