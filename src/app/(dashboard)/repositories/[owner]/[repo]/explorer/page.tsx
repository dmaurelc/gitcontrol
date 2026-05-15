import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getUserPreferences, readRepoDetailViewMode } from "@/lib/preferences/get-user-preferences";

type SearchParams = {
  branch?: string;
  commit?: string;
  leftTab?: string;
  page?: string;
};

export default async function RepoExplorerPage({
  params,
  searchParams,
}: {
  params: Promise<{ owner: string; repo: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const prefs = await getUserPreferences(session.user.id);
  const mode = readRepoDetailViewMode(prefs.filters);
  const { owner, repo } = await params;
  await searchParams;

  if (mode === "tabs") {
    redirect(`/repositories/${owner}/${repo}`);
  }

  return (
    <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Explorer view — scaffold</p>
      <p className="mt-1">
        3-panel layout for {owner}/{repo} pending in phase 02.
      </p>
    </div>
  );
}
