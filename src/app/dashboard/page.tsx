import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {session.user.name} ({session.user.email})
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await auth.api.signOut({ headers: await headers() });
            redirect("/login");
          }}
        >
          <Button variant="outline" type="submit">
            Sign out
          </Button>
        </form>
      </header>
      <p className="text-sm text-muted-foreground">
        Phase 04 will turn this into the real overview with sidebar, org
        switcher and live GitHub data.
      </p>
    </main>
  );
}
