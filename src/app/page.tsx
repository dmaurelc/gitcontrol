import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { getUserPreferences } from "@/lib/preferences/get-user-preferences";

const VIEW_TO_PATH: Record<string, string> = {
  dashboard: "/dashboard",
  repositories: "/repositories",
  stars: "/stars",
};

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const prefs = await getUserPreferences(session.user.id);
  redirect(VIEW_TO_PATH[prefs.defaultView] ?? "/dashboard");
}
