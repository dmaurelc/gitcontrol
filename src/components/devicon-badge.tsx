import Image from "next/image";
import { Code } from "lucide-react";
import { deviconSlug, deviconUrl } from "@/lib/github/language-devicon-map";
import { cn } from "@/lib/utils";

type Props = {
  language: string | null | undefined;
  size?: number;
  className?: string;
  /** When true, the badge is hidden if the language has no devicon mapping. */
  hideOnUnknown?: boolean;
};

/**
 * Renders the Devicon for a GitHub language as a small inline icon. Falls
 * back to a Lucide `Code` glyph for unmapped languages unless
 * `hideOnUnknown` is set.
 */
export function DeviconBadge({
  language,
  size = 14,
  className,
  hideOnUnknown = false,
}: Props) {
  const slug = deviconSlug(language);
  if (!slug) {
    if (hideOnUnknown) return null;
    return (
      <Code
        className={cn("text-muted-foreground", className)}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }
  return (
    <Image
      src={deviconUrl(slug)}
      alt={language ?? ""}
      width={size}
      height={size}
      className={cn("inline-block shrink-0", className)}
      unoptimized
    />
  );
}
