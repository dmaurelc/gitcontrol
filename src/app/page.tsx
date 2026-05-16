import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { LoginScreen } from "@/components/auth/login-screen";

// Root route now serves the login screen directly so the canonical URL
// for unauthenticated users is "/" rather than "/login". The /login path
// still exists for backward compatibility and renders the same component.
// Marketing landing remains available at
// src/components/marketing/landing-page.tsx if it needs to be restored.
export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/dashboard");
  return <LoginScreen />;
}
