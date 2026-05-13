"use client";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/icons/github-icon";
import { signIn } from "@/lib/auth/auth-client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    await signIn.social({ provider: "github", callbackURL: "/dashboard" });
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center gap-8 overflow-hidden bg-background p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
      >
        <div className="absolute left-1/2 top-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-br from-chart-1/20 via-chart-4/10 to-chart-2/20 blur-3xl" />
      </div>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="grid size-12 place-items-center rounded-xl bg-linear-to-br from-chart-1 to-chart-4 text-primary-foreground shadow-card">
          <Sparkles className="size-5" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">GitControl</h1>
          <p className="text-sm text-muted-foreground">
            Self-hosted GitHub dashboard. Sign in to continue.
          </p>
        </div>
      </div>
      <Button
        onClick={handleSignIn}
        disabled={loading}
        size="lg"
        className="min-w-56 shadow-card"
      >
        {loading ? <Loader2 className="animate-spin" /> : <GithubIcon />}
        Sign in with GitHub
      </Button>
      <p className="absolute bottom-6 text-[11px] text-muted-foreground/70">
        Read-only access. We never push to your repos.
      </p>
    </main>
  );
}
