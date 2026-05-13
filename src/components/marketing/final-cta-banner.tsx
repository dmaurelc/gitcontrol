import { GithubSignInButton } from "@/components/marketing/github-sign-in-button";
import { FadeInOnView } from "@/components/marketing/motion-primitives";

// Split-stat banner: marketing copy on the left, OAuth checklist + GitHub
// sign-in button on the right. Corner crosses tie it back to the landing
// frame; hairline center divider gives the two halves equal weight.
export function FinalCtaBanner() {
  return (
    <section className="py-24">
      <FadeInOnView className="relative border border-border bg-card">
        <CornerCross className="-left-2 -top-2" />
        <CornerCross className="-right-2 -top-2" />
        <CornerCross className="-bottom-2 -left-2" />
        <CornerCross className="-bottom-2 -right-2" />

        <div className="grid gap-px bg-border md:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-4 bg-card p-10 md:p-14">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Ready when you are
            </p>
            <h2 className="font-sans text-3xl tracking-tight md:text-4xl">
              One screen for every repo{" "}
              <span className="text-primary">you care about.</span>
            </h2>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              Sign in with GitHub. Skip the noise. Spend the day in your work,
              not in github.com&apos;s navigation.
            </p>
          </div>
          <div className="flex flex-col justify-between gap-6 bg-card p-10 md:p-14">
            <ul className="flex flex-col gap-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <li className="flex items-center gap-3">
                <span className="size-1 bg-primary" />
                <span>OAuth · 30 seconds</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="size-1 bg-primary" />
                <span>No payment required</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="size-1 bg-primary" />
                <span>Self-hosted</span>
              </li>
            </ul>
            <GithubSignInButton size="lg" />
          </div>
        </div>
      </FadeInOnView>
    </section>
  );
}

function CornerCross({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute z-10 grid size-4 place-items-center text-primary ${className ?? ""}`}
    >
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current" />
    </span>
  );
}
