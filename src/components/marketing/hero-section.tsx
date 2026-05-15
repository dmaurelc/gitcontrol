import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HyperText } from "@/components/hyper-text";
import { CmdKHint } from "@/components/marketing/cmd-k-hint";
import { GithubSignInButton } from "@/components/marketing/github-sign-in-button";
import { GlowPanel } from "@/components/marketing/glow-panel";
import { HeroIntroMotion } from "@/components/marketing/hero-intro-motion";
import { HeroMockup } from "@/components/marketing/hero-mockup";
import { FadeUp } from "@/components/marketing/motion-primitives";
import { StatusBadge } from "@/components/marketing/status-badge";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="bg-aurora pointer-events-none absolute left-1/2 -top-20 -z-20 aspect-square w-[50%] -translate-x-1/2 rounded-full opacity-20 blur-3xl md:-top-96 md:w-[70%]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] [background-size:24px_24px] opacity-50"
      />

      <div className="py-20 md:py-28 lg:grid lg:grid-cols-2 lg:gap-12 lg:py-48">
        <HeroIntroMotion>
          <div className="flex flex-col items-start">
            <StatusBadge tone="primary">v0.9.3 · Self-hosted</StatusBadge>

            <h1 className="mt-6 font-sans text-4xl leading-[1.05] tracking-tighter text-foreground md:text-6xl">
              <HyperText text="The GitHub dashboard" />{" "}
              <span className="text-primary">
                <HyperText text="you host yourself." duration={900} />
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
              Track everything happening across your repos and orgs — issues,
              pulls, stars, actions, projects, packages — without the noise of
              github.com. One screen, one cache, one shortcut.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <CmdKHint />
              <span>to jump anywhere.</span>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <GithubSignInButton size="lg" />
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-none"
              >
                <a href="#features" className="inline-flex items-center gap-2">
                  See what&apos;s inside <ArrowDown className="size-4" />
                </a>
              </Button>
            </div>
          </div>
        </HeroIntroMotion>

        <FadeUp delay={0.2} className="mt-16 lg:mt-0">
          <GlowPanel>
            <HeroMockup />
          </GlowPanel>
        </FadeUp>
      </div>
    </section>
  );
}
