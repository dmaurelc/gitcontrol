import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { MagicCard } from "@/components/ui/magic-card";

type StatCardProps = {
  title: string;
  value: number | string;
  icon?: React.ComponentType<{ className?: string }>;
  hint?: string;
  trend?: {
    value: string;
    direction?: "up" | "down" | "neutral";
  };
  accent?: "default" | "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5";
  className?: string;
  href?: string;
};

const ACCENT_BG: Record<NonNullable<StatCardProps["accent"]>, string> = {
  "default": "bg-muted text-muted-foreground",
  "chart-1": "bg-chart-1/10 text-chart-1",
  "chart-2": "bg-chart-2/10 text-chart-2",
  "chart-3": "bg-chart-3/15 text-chart-3",
  "chart-4": "bg-chart-4/15 text-chart-4",
  "chart-5": "bg-chart-5/15 text-chart-5",
};

const TREND_COLOR: Record<NonNullable<NonNullable<StatCardProps["trend"]>["direction"]>, string> = {
  up: "text-emerald-500",
  down: "text-rose-500",
  neutral: "text-muted-foreground",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  hint,
  trend,
  accent = "default",
  className,
  href,
}: StatCardProps) {
  const formatted =
    typeof value === "number" ? value.toLocaleString() : value;
  const card = (
    <Card
      className={cn(
        "relative gap-0 overflow-hidden border-none bg-transparent p-0 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5",
        href && "cursor-pointer",
        className,
      )}
    >
    <MagicCard
      gradientFrom="var(--color-chart-1)"
      gradientTo="var(--color-chart-2)"
      gradientColor="color-mix(in oklch, var(--color-chart-1) 18%, transparent)"
      gradientSize={220}
      className="flex flex-col gap-2 rounded-xl p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        {Icon ? (
          <div
            className={cn(
              "grid size-8 place-items-center rounded-lg",
              ACCENT_BG[accent],
            )}
          >
            <Icon className="size-4" />
          </div>
        ) : null}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">
          {formatted}
        </span>
        {trend ? (
          <span
            className={cn(
              "text-xs font-medium tabular-nums",
              TREND_COLOR[trend.direction ?? "neutral"],
            )}
          >
            {trend.value}
          </span>
        ) : null}
      </div>
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : (
        <div
          aria-hidden
          className="mt-1 h-6 w-full rounded-sm bg-linear-to-r from-transparent via-muted to-transparent opacity-40"
        />
      )}
    </MagicCard>
    </Card>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }
  return card;
}
