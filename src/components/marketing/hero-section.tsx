import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HyperText } from "@/components/hyper-text";
import { CmdKHint } from "@/components/marketing/cmd-k-hint";
import { GithubSignInButton } from "@/components/marketing/github-sign-in-button";
import { DashboardCtaButton } from "@/components/marketing/dashboard-cta-button";
import { GlowPanel } from "@/components/marketing/glow-panel";
import { HeroIntroMotion } from "@/components/marketing/hero-intro-motion";
import { HeroMockup } from "@/components/marketing/hero-mockup";
import { FadeUp } from "@/components/marketing/motion-primitives";
import { StatusBadge } from "@/components/marketing/status-badge";

export function HeroSection({
  isAuthenticated = false,
}: {
  isAuthenticated?: boolean;
}) {
  return (
    <section className="relative isolate">
      {/* Full-bleed backdrop: the negative insets cancel the LandingFrame's
          horizontal padding so the pattern reaches the frame's border-x
          instead of being clipped inside the content column. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-6 -right-6 -z-10 overflow-hidden md:-left-10 md:-right-10 lg:-left-16 lg:-right-16"
      >
        {/* Atmospheric glows on a diagonal — brand emerald behind the mockup
            (upper-right), a cooler teal behind the headline (upper-left). */}
        <div className="absolute inset-0 [background:radial-gradient(50%_62%_at_84%_-6%,color-mix(in_oklab,var(--color-primary)_20%,transparent),transparent_62%),radial-gradient(46%_54%_at_4%_10%,color-mix(in_oklab,var(--color-chart-3)_11%,transparent),transparent_60%)]" />
        {/* Blueprint grid: hairline rules faded through a radial mask so it
            reads near the top and dissolves toward the lower-left. */}
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,color-mix(in_oklab,var(--color-border)_70%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--color-border)_70%,transparent)_1px,transparent_1px)] [background-size:66px_66px] [mask-image:radial-gradient(145%_110%_at_78%_-10%,black_8%,transparent_74%)]" />
      </div>

      <div className="py-20 md:py-28 lg:grid lg:grid-cols-2 lg:gap-12 lg:py-48">
        <HeroIntroMotion>
          <div className="flex flex-col items-start">
            <StatusBadge tone="primary">v0.11.1 · Self-hosted</StatusBadge>

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
              {isAuthenticated ? (
                <DashboardCtaButton size="lg" />
              ) : (
                <GithubSignInButton size="lg" />
              )}
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
