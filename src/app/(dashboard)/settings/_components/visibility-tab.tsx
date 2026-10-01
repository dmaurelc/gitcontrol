import { githubService } from "@/lib/github/service";
import { getUserPreferences } from "@/lib/preferences/get-user-preferences";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrgVisibilityList } from "./org-visibility-list";
import {
  HiddenReposManager,
  type RepoEntry,
} from "./hidden-repos-manager";

export async function VisibilityTab({ userId }: { userId: string }) {
  const prefs = await getUserPreferences(userId);

  let viewerLogin = "";
  try {
    const v = await githubService.getViewer(userId);
    viewerLogin = v.data.login;
  } catch {
    // ignore
  }

  let orgs: Array<{
    login: string;
    avatar_url: string;
    description: string | null;
  }> = [];
  try {
    const res = await githubService.listOrgs(userId);
    orgs = res.data.map((o) => ({
      login: o.login,
      avatar_url: o.avatar_url,
      description: o.description,
    }));
  } catch {
    // ignore
  }

  let repoEntries: RepoEntry[] = [];
  try {
    const res = await githubService.listRepos(userId, {
      sort: "full_name",
      perPage: 100,
    });
    repoEntries = res.data.map((r) => ({
      full_name: r.full_name,
      owner: r.owner.login,
      ownerAvatar: r.owner.avatar_url,
      isPrivate: r.private,
    }));
  } catch {
    // ignore
  }

  return (
    <div className="flex flex-col gap-4">
      {orgs.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organizations</CardTitle>
            <CardDescription>
              Check the orgs you want to see in your dashboard listings. UI-only —
              GitHub access is unchanged.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrgVisibilityList
              orgs={orgs}
              initialHidden={prefs.hiddenOrgs}
            />
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Repositories</CardTitle>
          <CardDescription>
            Check the repos you want to see in listings; unchecked repos are
            hidden. Group by owner, filter by name, or use Show all / Hide all
            per owner. Pinned repos are always shown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HiddenReposManager
            initialHidden={prefs.hiddenRepos}
            repos={repoEntries}
            viewerLogin={viewerLogin}
          />
        </CardContent>
      </Card>
    </div>
  );
}
