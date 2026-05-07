"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  basePath: string;
  page: number;
  hasNext: boolean;
};

/**
 * Window-based numeric pagination. We don't know total pages from GitHub list
 * APIs, so we render a sliding window around the current page plus the first
 * page anchor. "Next" is disabled when hasNext === false.
 */
export function PaginationNav({ basePath, page, hasNext }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function hrefFor(p: number) {
    const next = new URLSearchParams(params);
    if (p === 1) next.delete("page");
    else next.set("page", String(p));
    const qs = next.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  function go(p: number) {
    startTransition(() => {
      router.push(hrefFor(p), { scroll: false });
    });
  }

  // Build the page list: 1, ..., page-1, page, page+1, (next? Next : nothing)
  const items: Array<number | "ellipsis"> = [];
  items.push(1);
  if (page - 2 > 1) items.push("ellipsis");
  if (page - 1 > 1) items.push(page - 1);
  if (page !== 1) items.push(page);
  if (hasNext) items.push(page + 1);

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex items-center justify-center gap-1 transition-opacity",
        pending && "opacity-60",
      )}
    >
      <NavButton
        disabled={page <= 1 || pending}
        onClick={() => go(Math.max(1, page - 1))}
        href={hrefFor(Math.max(1, page - 1))}
        ariaLabel="Previous page"
      >
        <ChevronLeft className="size-4" />
      </NavButton>

      {items.map((it, idx) =>
        it === "ellipsis" ? (
          <span
            key={`e-${idx}`}
            className="px-2 text-sm text-muted-foreground"
            aria-hidden
          >
            …
          </span>
        ) : (
          <NavButton
            key={it}
            active={it === page}
            disabled={pending}
            onClick={() => go(it)}
            href={hrefFor(it)}
            ariaLabel={`Go to page ${it}`}
          >
            <span className="tabular-nums">{it}</span>
          </NavButton>
        ),
      )}

      <NavButton
        disabled={!hasNext || pending}
        onClick={() => go(page + 1)}
        href={hrefFor(page + 1)}
        ariaLabel="Next page"
      >
        <ChevronRight className="size-4" />
      </NavButton>
    </nav>
  );
}

function NavButton({
  children,
  href,
  active,
  disabled,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  href: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  const cls = cn(
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2.5 text-sm transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
    disabled && "pointer-events-none opacity-50",
  );
  if (disabled) {
    return (
      <span aria-disabled className={cls}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className={cls}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {children}
    </Link>
  );
}
