import { Lock, Server, Users } from "lucide-react";
import {
  FadeInOnView,
  StaggerContainer,
  StaggerItem,
} from "@/components/marketing/motion-primitives";

const ITEMS = [
  {
    icon: Lock,
    title: "Encrypted at rest",
    description:
      "AES-256-GCM via node:crypto. Plaintext token column wiped post-handshake.",
  },
  {
    icon: Users,
    title: "Per-user isolation",
    description:
      "Cache keys prefixed by userId. Octokit clients built per request, bound to one user's token.",
  },
  {
    icon: Server,
    title: "Your infrastructure",
    description:
      "Single VPS. Only outbound calls go to api.github.com. Postgres + Redis stay on your box.",
  },
];

export function SecurityPrivacySection() {
  return (
    <section className="py-24">
      <FadeInOnView className="mb-12 max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Security & privacy
        </p>
        <h2 className="mt-3 font-sans text-3xl tracking-tight md:text-4xl">
          Tokens never leave your disk in plaintext.
        </h2>
      </FadeInOnView>
      <StaggerContainer className="grid gap-6 md:grid-cols-3">
        {ITEMS.map(({ icon: Icon, title, description }) => (
          <StaggerItem key={title}>
            <article className="group h-full rounded-none border border-border bg-card p-6 transition-colors hover:border-primary">
              <Icon className="size-6 text-primary" strokeWidth={1.5} />
              <h3 className="mt-4 font-sans text-lg tracking-tight">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </article>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
