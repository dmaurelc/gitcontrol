import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { githubService, type RepoRelease } from "@/lib/github/service";
import { getReleaseCommitDate } from "@/lib/github/release-commit-date";
import { UPSTREAM_OWNER, UPSTREAM_REPO } from "@/lib/github/upstream";
import { ChangelogEmpty } from "./_components/changelog-empty";
import { ReleaseCard, type ReleaseCardItem } from "./_components/release-card";

export const metadata = { title: "Changelog — GitControl" };

const PER_PAGE = 20;

export default async function ChangelogPage() {
  // Dashboard layout already enforces auth; session is guaranteed here.
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  let view: "ok" | "private" | "error" = "ok";
  let releases: RepoRelease[] = [];

  try {
    const res = await githubService.listReleases(
      userId,
      UPSTREAM_OWNER,
      UPSTREAM_REPO,
      PER_PAGE,
    );
    releases = (res.data ?? []).filter((r) => !r.draft);
  } catch (err) {
    const e = err as { status?: number };
    view = e.status === 404 ? "private" : "error";
  }

  // Enrich each release with its tag commit date. GitHub's `published_at`
  // is immutable and reflects the moment the Release row was created, not
  // when the code shipped — back-dated tags read more honestly here.
  const items: ReleaseCardItem[] = await Promise.all(
    releases.map(async (r) => ({
      release: r,
      commitDate: await getReleaseCommitDate(
        userId,
        UPSTREAM_OWNER,
        UPSTREAM_REPO,
        r.tag_name,
      ),
    })),
  );

  // Sort by best-known date desc (commitDate when present, else published_at).
  items.sort((a, b) => {
    const da = a.commitDate ?? a.release.published_at ?? a.release.created_at;
    const db = b.commitDate ?? b.release.published_at ?? b.release.created_at;
    return new Date(db).getTime() - new Date(da).getTime();
  });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Changelog</h1>
        <p className="text-sm text-muted-foreground">
          Releases for GitControl. Sourced from GitHub Releases.
        </p>
      </header>

      {view === "private" ? (
        <ChangelogEmpty variant="private" />
      ) : view === "error" ? (
        <ChangelogEmpty variant="error" />
      ) : items.length === 0 ? (
        <ChangelogEmpty variant="empty" />
      ) : (
        <div className="flex flex-col gap-6">
          {items.map((item) => (
            <ReleaseCard key={item.release.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
