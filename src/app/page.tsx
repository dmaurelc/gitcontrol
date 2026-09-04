import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import LandingPage from "@/components/marketing/landing-page";

// Root route is the public marketing landing for everyone. Signed-in visitors
// see it too — the CTAs switch to "Go to dashboard" instead of sign-in — so
// they can always come back here from the app.
export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  return <LandingPage isAuthenticated={!!session} />;
}
