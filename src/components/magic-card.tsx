"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"div">;

/**
 * Wrapper that tracks the cursor and sets `--glow-x` / `--glow-y` CSS vars on
 * itself. Descendants with `.magic-card` inherit those vars and use them in a
 * radial-gradient ::after for the glow.
 */
export function GlowCard({
  className,
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
    <div {...rest} onMouseMove={handleMouseMove} className={cn(className)}>
      {children}
    </div>
  );
}
