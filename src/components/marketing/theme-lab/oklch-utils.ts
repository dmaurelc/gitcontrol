// OKLCH → sRGB conversion (Björn Ottosson) plus WCAG contrast helpers.
// Used by the Theme Lab panel to render swatches and live contrast ratios.

function oklchToLinear(L: number, C: number, H: number): [number, number, number] {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function linToSrgb(c: number): number {
  const x = clamp01(c);
  return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

export function oklchHex(L: number, C: number, H: number): string {
  const [r, g, b] = oklchToLinear(L, C, H);
  const to = (v: number) =>
    Math.round(linToSrgb(v) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function relLum(L: number, C: number, H: number): number {
  const [r, g, b] = oklchToLinear(L, C, H).map(clamp01);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const l1 = relLum(...a);
  const l2 = relLum(...b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

export type AaTag = { label: string; tone: "pass" | "large" | "fail" };

export function aaTag(ratio: number): AaTag {
  if (ratio >= 4.5) return { label: "AA", tone: "pass" };
  if (ratio >= 3) return { label: "AA large", tone: "large" };
  return { label: "Falla", tone: "fail" };
}
