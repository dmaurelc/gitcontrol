"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"div"> & {
  beam?: boolean;
};

/**
 * Card wrapper with optional rotating border beam on hover and a soft glow
 * that tracks the cursor. CSS-only, no animation libs.
 */
export function MagicCard({
  className,
  beam = true,
  onMouseMove,
  children,
  ...rest
}: Props) {
  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      e.currentTarget.style.setProperty("--glow-x", `${x}%`);
      e.currentTarget.style.setProperty("--glow-y", `${y}%`);
      onMouseMove?.(e);
    },
    [onMouseMove],
  );

  return (
    <div
      {...rest}
      onMouseMove={handleMouseMove}
      className={cn("magic-card", beam && "border-beam", className)}
    >
      {children}
    </div>
  );
}
