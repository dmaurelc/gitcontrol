import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import LandingPage from "@/components/marketing/landing-page";

export const metadata: Metadata = {
  title: "GitControl — Self-hosted GitHub dashboard",
  description:
    "Self-hosted, multi-user replacement for github.com's UI. Encrypted OAuth tokens, per-user Redis cache with ETag revalidation, full coverage of repos, issues, pulls, stars, projects, packages.",
  openGraph: {
    title: "GitControl — Self-hosted GitHub dashboard",
    description: "Encrypted tokens. Per-user cache. Your VPS.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GitControl — Self-hosted GitHub dashboard",
    description: "Encrypted tokens. Per-user cache. Your VPS.",
  },
};

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/dashboard");
  return <LandingPage />;
}
