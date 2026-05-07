"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type Props = {
  text: string;
  duration?: number;
  className?: string;
  /** Trigger animation only on first mount (default true). */
  animateOnce?: boolean;
};

/**
 * HyperText: per-character scramble that resolves to the final string.
 * Pure JS + setInterval, no animation libs. Respects prefers-reduced-motion.
 */
export function HyperText({
  text,
  duration = 700,
  className,
  animateOnce = true,
}: Props) {
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [display, setDisplay] = React.useState(() =>
    animateOnce && !reducedMotion ? scrambleAll(text) : text,
  );
  const ranRef = React.useRef(false);

  React.useEffect(() => {
    if (animateOnce && ranRef.current) return;
    ranRef.current = true;
    if (reducedMotion) return;

    const chars = text.split("");
    const total = chars.length;
    const settleStep = Math.max(1, Math.floor(duration / Math.max(total, 1)));
    let frame = 0;
    const id = setInterval(() => {
      frame += 1;
      setDisplay(
        chars
          .map((c, i) => {
            if (i < frame) return c;
            if (c === " ") return " ";
            return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
          })
          .join(""),
      );
      if (frame >= total) {
        clearInterval(id);
        setDisplay(text);
      }
    }, settleStep);
    return () => clearInterval(id);
  }, [text, duration, animateOnce, reducedMotion]);

  return (
    <span className={cn("inline-block tabular-nums", className)} aria-label={text}>
      {display}
    </span>
  );
}

function scrambleAll(text: string) {
  return text
    .split("")
    .map((c) => (c === " " ? " " : ALPHABET[Math.floor(Math.random() * ALPHABET.length)]))
    .join("");
}
