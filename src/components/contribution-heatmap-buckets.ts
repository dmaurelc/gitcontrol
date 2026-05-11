// Pure helpers for the contribution heatmap color buckets.
// 5 levels following GitHub's convention. Uses the project chart-1 token so
// the heatmap matches the brand palette. Bucket 0 stays muted; 1-4 scale
// opacity over chart-1.

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
  1: "fill-chart-1/25",
  2: "fill-chart-1/50",
  3: "fill-chart-1/75",
  4: "fill-chart-1",
};

export function bucketClass(count: number): string {
  return BUCKET_CLASSES[bucketIndex(count)];
}
