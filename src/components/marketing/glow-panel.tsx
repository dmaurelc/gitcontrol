import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function GlowPanel({ children, className }: Props) {
  return (
    <div className={cn("relative", className)}>
      <div
        aria-hidden
        className="bg-code-glow pointer-events-none absolute -inset-8 -z-10 opacity-60 blur-2xl"
      />
      <div className="relative rounded-none border border-border bg-card/70 p-2 shadow-md backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}
