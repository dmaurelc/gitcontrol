export type VisibilityRepo = {
  full_name: string;
  owner: { login: string };
};

export type VisibilityPrefs = {
  hiddenOrgs: string[];
  hiddenRepos: string[];
};

/**
 * Returns true if the repo should be visible given user prefs.
 * Pinned repos always override hidden filters (UX safety).
 */
export function isVisible(
  repo: VisibilityRepo,
  prefs: VisibilityPrefs,
  pinnedSet: Set<string>,
): boolean {
  if (pinnedSet.has(repo.full_name)) return true;
  if (prefs.hiddenRepos.includes(repo.full_name)) return false;
  if (prefs.hiddenOrgs.includes(repo.owner.login)) return false;
  return true;
}

export function filterVisible<T extends VisibilityRepo>(
  repos: T[],
  prefs: VisibilityPrefs,
  pinnedSet: Set<string>,
): T[] {
  return repos.filter((r) => isVisible(r, prefs, pinnedSet));
}
