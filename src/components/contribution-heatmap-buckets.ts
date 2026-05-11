// Pure helpers for the contribution heatmap color buckets.
// 5 levels following GitHub's convention. Tailwind classes target SVG `fill-*`
// with dark-mode overrides. Thresholds are inclusive lower bounds.

export const BUCKET_THRESHOLDS = [0, 1, 4, 8, 16] as const;

export function bucketIndex(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 3) return 1;
  if (count <= 7) return 2;
  if (count <= 15) return 3;
  return 4;
}

export const BUCKET_CLASSES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "fill-muted",
  1: "fill-green-200 dark:fill-green-900",
  2: "fill-green-400 dark:fill-green-700",
  3: "fill-green-600 dark:fill-green-500",
  4: "fill-green-800 dark:fill-green-300",
};

export function bucketClass(count: number): string {
  return BUCKET_CLASSES[bucketIndex(count)];
}
