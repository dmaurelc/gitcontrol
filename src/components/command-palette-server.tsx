import { githubService } from "@/lib/github/service";
import { getUserPreferences } from "@/lib/preferences/get-user-preferences";
import { filterVisible } from "@/lib/preferences/visibility-filter";
import { CommandPalette } from "./command-palette";
import type { Repo } from "@/lib/github/service";

type CommandPaletteServerProps = {
  userId: string;
};

export type RepoIndexEntry = Pick<
  Repo,
  "id" | "full_name" | "description" | "language" | "private"
>;

const MAX_INDEX_SIZE = 200;

/**
 * Server wrapper: fetches the user's repos plus repos for every active org
 * the user belongs to, dedupes by id, applies visibility prefs, and passes
 * the merged list to the client CommandPalette. Pinned repos override
 * hidden filters. On error the palette still works with quick links.
 */
export async function CommandPaletteServer({
  userId,
}: CommandPaletteServerProps) {
  let repos: RepoIndexEntry[] = [];

  try {
    const prefs = await getUserPreferences(userId);
    const pinnedSet = new Set(prefs.pinnedRepos);

    // Viewer + every org in parallel; tolerate partial failures.
    const orgsRes = await githubService.listOrgs(userId).catch(() => null);
    const orgLogins = (orgsRes?.data ?? []).map((o) => o.login);

    const settled = await Promise.allSettled([
      githubService.listRepos(userId, { perPage: 100, sort: "updated" }),
      ...orgLogins.map((org) =>
        githubService.listOrgRepos(userId, org, {
          perPage: 100,
          sort: "updated",
        }),
      ),
    ]);

    const byId = new Map<number, Repo>();
    for (const r of settled) {
      if (r.status !== "fulfilled") continue;
      for (const repo of r.value.data) {
        if (!byId.has(repo.id)) byId.set(repo.id, repo);
      }
    }

    repos = filterVisible(Array.from(byId.values()), prefs, pinnedSet)
      .sort(
        (a, b) =>
          new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime(),
      )
      .slice(0, MAX_INDEX_SIZE)
      .map((r) => ({
        id: r.id,
        full_name: r.full_name,
        description: r.description,
        language: r.language,
        private: r.private,
      }));
  } catch {
    // empty repos — quick links still work
  }

  return <CommandPalette repos={repos} />;
}
