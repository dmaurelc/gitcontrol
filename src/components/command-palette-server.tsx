import { githubService } from "@/lib/github/service";
import { getUserPreferences } from "@/lib/preferences/get-user-preferences";
import { filterVisible } from "@/lib/preferences/visibility-filter";
import { CommandPalette } from "./command-palette";
import type { Repo } from "@/lib/github/service";

type CommandPaletteServerProps = {
  userId: string;
};

/**
 * Server wrapper: fetches the user's top 100 repos (sorted by recently updated),
 * filters out hidden orgs/repos via the visibility prefs, and passes them as
 * initial data to the client CommandPalette. Pinned repos override hidden.
 * On error returns an empty repo list so the palette still works for quick links.
 */
export async function CommandPaletteServer({ userId }: CommandPaletteServerProps) {
  let repos: Pick<Repo, "id" | "full_name" | "description" | "language" | "private">[] = [];
  try {
    const [reposRes, prefs] = await Promise.all([
      githubService.listRepos(userId, { perPage: 100, sort: "updated" }),
      getUserPreferences(userId),
    ]);
    const pinnedSet = new Set(prefs.pinnedRepos);
    repos = filterVisible(reposRes.data, prefs, pinnedSet).map((r) => ({
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
