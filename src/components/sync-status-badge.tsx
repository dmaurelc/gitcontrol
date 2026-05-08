"use client";
import { useEffect, useState, useTransition } from "react";
import { RefreshCw, Wifi, Clock, AlertTriangle } from "lucide-react";
import { computeFreshness, formatAge } from "@/lib/github/freshness";
import { revalidatePathAction } from "@/app/actions/revalidate";
import { cn } from "@/lib/utils";

type Props = {
  /** Epoch seconds the cached body was last fetched. */
  fetchedAt: number;
  /** TTL the cache entry was written with. */
  ttlSeconds: number;
  /** Path to revalidate when user clicks. */
  path: string;
  className?: string;
};

export function SyncStatusBadge({
  fetchedAt,
  ttlSeconds,
  path,
  className,
}: Props) {
  // Recompute label every 30s so it ages without a network round-trip.
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const id = setInterval(
      () => setNow(Math.floor(Date.now() / 1000)),
      30_000,
    );
    return () => clearInterval(id);
  }, []);

  const { state, ageSeconds } = computeFreshness(fetchedAt, ttlSeconds, now);

  const styles: Record<
    typeof state,
    { label: string; tone: string; Icon: typeof Wifi }
  > = {
    live: {
      label: `Live · ${formatAge(ageSeconds)}`,
      tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      Icon: Wifi,
    },
    cached: {
      label: `Cached · ${formatAge(ageSeconds)}`,
      tone: "border-border bg-muted/40 text-muted-foreground",
      Icon: Clock,
    },
    stale: {
      label: pending ? "Refreshing…" : `Stale · ${formatAge(ageSeconds)}`,
      tone: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      Icon: AlertTriangle,
    },
  };

  const meta = styles[state];
  const Icon = pending ? RefreshCw : meta.Icon;

  function refresh() {
    if (pending) return;
    startTransition(async () => {
      await revalidatePathAction(path);
      setNow(Math.floor(Date.now() / 1000));
    });
  }

  const fetchedAtLabel = new Date(fetchedAt * 1000).toLocaleString();
  const tooltip = `Last fetched: ${fetchedAtLabel}\nTTL: ${ttlSeconds}s · click to refresh`;

  return (
    <button
      type="button"
      onClick={refresh}
      disabled={pending}
      aria-label="Refresh data"
      title={tooltip}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium tabular-nums transition-opacity",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        meta.tone,
        pending && "cursor-wait opacity-70",
        className,
      )}
    >
      <Icon className={cn("size-3", pending && "animate-spin")} />
      {meta.label}
    </button>
  );
}
