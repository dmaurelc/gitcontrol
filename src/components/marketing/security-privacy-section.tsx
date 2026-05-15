import { Lock, Server, Users } from "lucide-react";
import {
  FadeInOnView,
  StaggerContainer,
  StaggerItem,
} from "@/components/marketing/motion-primitives";

const ITEMS = [
  {
    id: "01",
    icon: Lock,
    title: "Encrypted at rest",
    description:
      "AES-256-GCM via node:crypto. Plaintext token column wiped post-handshake.",
    tag: "AES-256-GCM",
  },
  {
    id: "02",
    icon: Users,
    title: "Per-user isolation",
    description:
      "Cache keys prefixed by userId. Octokit clients built per request, bound to one user's token.",
    tag: "userId-prefixed",
  },
  {
    id: "03",
    icon: Server,
    title: "Your infrastructure",
    description:
      "Single VPS. Only outbound calls go to api.github.com. Postgres + Redis stay on your box.",
    tag: "single-VPS",
  },
] as const;

// Masonry layout: one feature card spans the full left column (1/3 width,
// 2 rows tall), with two compact cards stacked on the right (2/3 width
// each). Cards share the landing's hairline-border + lime-accent vocabulary.
export function SecurityPrivacySection() {
  const [encrypted, isolation, infra] = ITEMS;

  return (
    <section className="py-24">
      <FadeInOnView className="mb-12 max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Security &amp; privacy
        </p>
        <h2 className="mt-3 font-sans text-3xl tracking-tight md:text-4xl">
          Tokens never leave your disk in plaintext.
        </h2>
      </FadeInOnView>

      <StaggerContainer className="grid gap-px bg-border md:grid-cols-3 md:grid-rows-[auto_auto]">
        {/* Feature card — spans full left column, 2 rows */}
        <StaggerItem className="md:row-span-2">
          <article className="group relative flex h-full flex-col gap-4 bg-background p-8 transition-colors hover:bg-card">
            <span
              aria-hidden
              className="pointer-events-none absolute right-4 top-4 size-2 border-r border-t border-primary"
            />
            <encrypted.icon className="size-6 text-primary" strokeWidth={1.5} />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {encrypted.id} · {encrypted.tag}
            </span>
            <h3 className="font-sans text-2xl tracking-tight md:text-3xl">
              {encrypted.title}
            </h3>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {encrypted.description}
            </p>
            <div className="mt-auto flex flex-col gap-1 border-t border-border pt-4 font-mono text-[11px] text-muted-foreground">
              <span>$ openssl rand -hex 32</span>
              <span className="text-primary">→ 64-char key · GCM auth tag</span>
            </div>
          </article>
        </StaggerItem>

        {/* Compact: cache key shape */}
        <StaggerItem className="md:col-span-2">
          <article className="group flex h-full flex-col gap-4 bg-background p-8 transition-colors hover:bg-card">
            <div className="flex items-center justify-between">
              <isolation.icon className="size-5 text-primary" strokeWidth={1.5} />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {isolation.id} · {isolation.tag}
              </span>
            </div>
            <h3 className="font-sans text-xl tracking-tight">{isolation.title}</h3>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {isolation.description}
            </p>
            <code className="mt-auto block w-fit border border-border bg-card px-3 py-1.5 font-mono text-xs">
              <span className="text-primary">u:</span>
              <span className="text-foreground">{`{userId}`}</span>
              <span className="text-muted-foreground">:repo:</span>
              <span className="text-foreground">{`{slug}`}</span>
            </code>
          </article>
        </StaggerItem>

        {/* Compact: infra tree */}
        <StaggerItem className="md:col-span-2">
          <article className="group flex h-full flex-col gap-4 bg-background p-8 transition-colors hover:bg-card">
            <div className="flex items-center justify-between">
              <infra.icon className="size-5 text-primary" strokeWidth={1.5} />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {infra.id} · {infra.tag}
              </span>
            </div>
            <h3 className="font-sans text-xl tracking-tight">{infra.title}</h3>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {infra.description}
            </p>
            <pre className="mt-auto overflow-hidden border-l-2 border-primary bg-card px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground">
{`your-vps
├── gitcontrol (next)
├── postgres
└── redis      → api.github.com`}
            </pre>
          </article>
        </StaggerItem>
      </StaggerContainer>
    </section>
  );
}
