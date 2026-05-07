import { githubService } from "@/lib/github/service";
import { CommandPalette } from "./command-palette";
import type { Repo } from "@/lib/github/service";

type CommandPaletteServerProps = {
  userId: string;
};

/**
 * Server wrapper: fetches the user's top 100 repos (sorted by recently updated)
 * and passes them as initial data to the client CommandPalette.
 * On error returns an empty repo list so the palette still works for quick links.
 */
export async function CommandPaletteServer({ userId }: CommandPaletteServerProps) {
  let repos: Pick<Repo, "id" | "full_name" | "description" | "language" | "private">[] = [];
  try {
    const res = await githubService.listRepos(userId, { perPage: 100, sort: "updated" });
    repos = res.data.map((r) => ({
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
