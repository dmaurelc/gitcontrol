import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { LoginScreen } from "@/components/auth/login-screen";

// Direct sign-in screen. The marketing landing lives at "/"; this path is
// where protected routes send signed-out users so they get a focused login
// instead of the full landing. Authenticated users go to the dashboard.
export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/dashboard");
  return <LoginScreen />;
}
