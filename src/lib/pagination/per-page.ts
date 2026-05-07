export const PER_PAGE_OPTIONS = [12, 24, 48, 96] as const;
export const DEFAULT_PER_PAGE = 12;
export const MIN_PER_PAGE = 12;
export const MAX_PER_PAGE = 96;

export function clampPerPage(raw: string | undefined | null): number {
  const n = Number(raw ?? DEFAULT_PER_PAGE);
  if (!Number.isFinite(n)) return DEFAULT_PER_PAGE;
  if (n < MIN_PER_PAGE) return MIN_PER_PAGE;
  if (n > MAX_PER_PAGE) return MAX_PER_PAGE;
  return Math.floor(n);
}
