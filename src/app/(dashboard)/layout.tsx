import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { getActiveContext } from "@/lib/context/active-context";
import { AppSidebar } from "./_components/app-sidebar";
import { Topbar } from "./_components/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  // Best-effort: load viewer + orgs for context switcher. If GitHub fails we
  // still render the shell with the user's session info.
  let viewerLogin = session.user.name ?? session.user.email;
  let avatarUrl: string | null = null;
  let orgs: Array<{ login: string; avatar_url: string }> = [];
  try {
    const viewer = await githubService.getViewer(session.user.id);
    viewerLogin = viewer.data.login;
    avatarUrl = viewer.data.avatar_url ?? null;
    const orgsRes = await githubService.listOrgs(session.user.id);
    orgs = orgsRes.data.map((o) => ({
      login: o.login,
      avatar_url: o.avatar_url,
    }));
  } catch {
    // Token may be missing for the very first request; UI will still render.
  }

  const ctx = await getActiveContext(session.user.id, viewerLogin);

  return (
    <div className="grid min-h-svh grid-cols-1 md:grid-cols-[256px_1fr]">
      <div className="hidden md:block md:sticky md:top-0 md:h-svh">
        <AppSidebar
          className="h-full"
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image ?? avatarUrl,
            login: viewerLogin,
          }}
        />
      </div>
      <div className="flex min-w-0 flex-col">
        <Topbar
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image ?? avatarUrl,
            login: viewerLogin,
          }}
          orgs={orgs}
          activeContext={ctx}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
