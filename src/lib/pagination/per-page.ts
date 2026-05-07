export const PER_PAGE_OPTIONS = [10, 30, 50, 100] as const;
export const DEFAULT_PER_PAGE = 30;
export const MIN_PER_PAGE = 10;
export const MAX_PER_PAGE = 100;

export function clampPerPage(raw: string | undefined | null): number {
  const n = Number(raw ?? DEFAULT_PER_PAGE);
  if (!Number.isFinite(n)) return DEFAULT_PER_PAGE;
  if (n < MIN_PER_PAGE) return MIN_PER_PAGE;
  if (n > MAX_PER_PAGE) return MAX_PER_PAGE;
  return Math.floor(n);
}
