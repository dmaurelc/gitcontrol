"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { NodeMark } from "@/components/icons/node-mark";
import { GithubSignInButton } from "@/components/marketing/github-sign-in-button";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Architecture", href: "#architecture" },
  { label: "Benefits", href: "#benefits" },
  { label: "FAQ", href: "#faq" },
];

function Wordmark() {
  return (
    <span className="flex items-center gap-2 font-sans text-lg font-semibold tracking-tight text-foreground">
      <NodeMark className="size-5 text-primary" />
      GitControl
    </span>
  );
}

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-sidebar-border bg-background/70 backdrop-blur">
        <div className="relative mx-auto flex h-16 max-w-8xl items-center justify-between border-x border-border px-6 md:px-10 lg:px-16">
          <NavCorner className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
          <NavCorner className="bottom-0 right-0 translate-x-1/2 translate-y-1/2" />
          <Link href="/" aria-label="GitControl home">
            <Wordmark />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-sans text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:block">
            <GithubSignInButton size="sm" label="Sign in" />
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="rounded-none border border-border bg-background p-2 text-foreground lg:hidden"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex flex-col bg-background lg:hidden"
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6 py-4">
            <Wordmark />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="rounded-none border border-border bg-background p-2 text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-6 py-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-border py-5 font-sans text-base text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="border-t border-border px-6 py-6">
            <GithubSignInButton size="lg" />
          </div>
        </div>
      )}
    </>
  );
}

function NavCorner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute z-20 grid size-4 place-items-center text-primary ${className ?? ""}`}
    >
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current" />
    </span>
  );
}
