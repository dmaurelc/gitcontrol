import { NodeMark } from "@/components/icons/node-mark";
import { StatusBadge } from "@/components/marketing/status-badge";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "Architecture", href: "#architecture" },
  { label: "Benefits", href: "#benefits" },
  { label: "FAQ", href: "#faq" },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-8xl border-x border-border px-6 py-12 md:px-10 lg:px-16">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <NodeMark className="size-5 text-primary" />
            <span className="font-sans text-lg font-semibold tracking-tight">
              GitControl
            </span>
            <StatusBadge tone="primary">v0.9.3</StatusBadge>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-sans text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <p className="mt-8 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Made for developers who self-host.
        </p>
      </div>
    </footer>
  );
}
