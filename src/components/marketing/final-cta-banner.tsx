import { GithubSignInButton } from "@/components/marketing/github-sign-in-button";
import { FadeInOnView } from "@/components/marketing/motion-primitives";

export function FinalCtaBanner() {
  return (
    <section className="py-24">
      <FadeInOnView className="relative mx-auto max-w-3xl border border-border bg-card p-10 text-center md:p-16">
        <CornerCross className="-left-2 -top-2" />
        <CornerCross className="-right-2 -top-2" />
        <CornerCross className="-bottom-2 -left-2" />
        <CornerCross className="-bottom-2 -right-2" />

        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Ready when you are
        </p>
        <h2 className="mt-4 font-sans text-3xl tracking-tighter md:text-5xl">
          One screen for every repo <span className="text-primary">you care about.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Sign in with GitHub. Skip the noise. Spend the day in your work, not in github.com&apos;s navigation.
        </p>
        <div className="mt-8 flex justify-center">
          <GithubSignInButton size="lg" />
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
