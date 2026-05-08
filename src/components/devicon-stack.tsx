import Image from "next/image";
import { Code } from "lucide-react";
import { deviconSlug, deviconUrl } from "@/lib/github/language-devicon-map";
import { cn } from "@/lib/utils";

type Props = {
  /** Either a `Record<lang, bytes>` from listLanguages, or an ordered string[]. */
  languages: Record<string, number> | string[] | null | undefined;
  /** How many icons to render before collapsing to "+N". Default 2. */
  max?: number;
  size?: number;
  className?: string;
};

/**
 * Renders up to `max` Devicon SVGs side-by-side, with a "+N" pill when
 * additional languages exist. Falls back to a single Lucide Code glyph
 * when there's nothing to show. Each icon sits on a neutral bg ring so
 * white-on-white / black-on-black languages stay legible across themes.
 */
export function DeviconStack({
  languages,
  max = 2,
  size = 16,
  className,
}: Props) {
  const ordered = normalize(languages);
  if (ordered.length === 0) {
    return (
      <Code
        className={cn("text-muted-foreground", className)}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  const visible = ordered.slice(0, max);
  const overflow = ordered.length - visible.length;

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      aria-label={ordered.join(", ")}
    >
      {visible.map((lang) => (
        <IconChip key={lang} language={lang} size={size} />
      ))}
      {overflow > 0 ? (
        <span
          className="inline-flex items-center justify-center rounded-full border bg-muted/40 px-1.5 text-[10px] font-medium leading-none text-muted-foreground tabular-nums"
          style={{ height: size + 4, minWidth: size + 8 }}
        >
          +{overflow}
        </span>
      ) : null}
    </span>
  );
}

function IconChip({
  language,
  size,
}: {
  language: string;
  size: number;
}) {
  const slug = deviconSlug(language);
  const chip = (
    <span
      title={language}
      className="inline-flex items-center justify-center rounded-full border bg-background ring-1 ring-border/50"
      style={{ width: size + 4, height: size + 4 }}
    >
      {slug ? (
        <Image
          src={deviconUrl(slug)}
          alt={language}
          width={size}
          height={size}
          className="inline-block shrink-0"
          unoptimized
        />
      ) : (
        <Code
          className="text-muted-foreground"
          style={{ width: size, height: size }}
          aria-hidden
        />
      )}
    </span>
  );
  return chip;
}

function normalize(
  input: Record<string, number> | string[] | null | undefined,
): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(Boolean);
  return Object.entries(input)
    .sort(([, a], [, b]) => b - a)
    .map(([k]) => k);
}
