"use client";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth/auth-client";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      width="16"
      height="16"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.7.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2.9-.3 2-.4 3-.4s2.1.1 3 .4c2.3-1.6 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9 0-6.3-5.2-11.5-11.5-11.5z" />
    </svg>
  );
}

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
