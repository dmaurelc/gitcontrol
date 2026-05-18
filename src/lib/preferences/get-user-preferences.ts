import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { userPreferences } from "@/lib/db/schema";

export type ViewMode = "grid" | "list";
export type ViewModeScope = "repos" | "stars";

export type RepoDetailViewMode = "tabs" | "explorer";

export type ViewModeMap = {
  repos?: ViewMode;
  stars?: ViewMode;
  repoDetail?: RepoDetailViewMode;
};

export type PreferenceFilters = {
  viewMode?: ViewModeMap;
  // Future filter keys live here. Keep typed when added.
  [key: string]: unknown;
};

export type UserPreferences = {
  userId: string;
  theme: "light" | "dark";
  defaultView: "dashboard" | "repositories" | "stars";
  pinnedRepos: string[];
  hiddenOrgs: string[];
  hiddenRepos: string[];
  filters: PreferenceFilters;
};

export const DEFAULT_VIEW_MODE: ViewMode = "grid";
export const DEFAULT_REPO_DETAIL_VIEW_MODE: RepoDetailViewMode = "tabs";

export function readViewMode(
  filters: PreferenceFilters,
  scope: ViewModeScope,
): ViewMode {
  const v = filters.viewMode?.[scope];
  return v === "list" || v === "grid" ? v : DEFAULT_VIEW_MODE;
}

export function readRepoDetailViewMode(
  filters: PreferenceFilters,
): RepoDetailViewMode {
  const v = filters.viewMode?.repoDetail;
  return v === "explorer" || v === "tabs" ? v : DEFAULT_REPO_DETAIL_VIEW_MODE;
}

const DEFAULTS: Omit<UserPreferences, "userId"> = {
  theme: "dark",
  defaultView: "dashboard",
  pinnedRepos: [],
  hiddenOrgs: [],
  hiddenRepos: [],
  filters: {},
};

/**
 * Returns the user's preferences row, creating it with defaults if it does
 * not exist yet.
 */
export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences> {
  const rows = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  if (rows[0]) {
    return {
      userId,
      theme: rows[0].theme === "light" ? "light" : "dark",
      defaultView:
        (rows[0].defaultView as UserPreferences["defaultView"]) ??
        DEFAULTS.defaultView,
      pinnedRepos: rows[0].pinnedRepos ?? [],
      hiddenOrgs: rows[0].hiddenOrgs ?? [],
      hiddenRepos: rows[0].hiddenRepos ?? [],
      filters: (rows[0].filters ?? {}) as PreferenceFilters,
    };
  }
  await db.insert(userPreferences).values({ userId, ...DEFAULTS });
  return { userId, ...DEFAULTS };
}
