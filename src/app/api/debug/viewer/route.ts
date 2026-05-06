import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { GithubError } from "@/lib/github/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled in production" }, { status: 404 });
  }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const viewer = await githubService.getViewer(session.user.id);
    const orgs = await githubService.listOrgs(session.user.id);
    return NextResponse.json({
      viewer: {
        login: viewer.data.login,
        name: viewer.data.name,
        publicRepos: viewer.data.public_repos,
        privateRepos: viewer.data.total_private_repos,
        followers: viewer.data.followers,
        fromCache: viewer.fromCache,
      },
      orgs: {
        count: orgs.data.length,
        logins: orgs.data.map((o) => o.login),
        fromCache: orgs.fromCache,
      },
    });
  } catch (err) {
    if (err instanceof GithubError) {
      return NextResponse.json({ error: err.message, status: err.status }, { status: err.status });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
