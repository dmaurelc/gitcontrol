import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

// Landing page is intentionally skipped: signed-out users go straight to
// /login. The marketing landing component still lives at
// src/components/marketing/landing-page.tsx if it needs to be restored.
export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  redirect(session ? "/dashboard" : "/login");
}
