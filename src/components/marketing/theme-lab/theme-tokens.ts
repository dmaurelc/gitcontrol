// Theme Lab model: the 10 editable "knobs" per theme, the derivation of the
// full design-token set from them, and CSS export. Starting values mirror the
// current globals.css so the panel opens on the real theme.

import { contrast } from "@/components/marketing/theme-lab/oklch-utils";

export type Knobs = {
  pL: number;
  pC: number;
  pH: number;
  bgL: number;
  bgC: number;
  bgH: number;
  cardL: number;
  fgL: number;
  mfL: number;
  borderL: number;
};

export type ThemeName = "light" | "dark";
// radius (rem) and shadow strength are shared across both themes, matching how
// globals.css keeps them identical in :root and .dark.
export type GlobalKnobs = { radius: number; shadow: number };
export type LabState = { light: Knobs; dark: Knobs; global: GlobalKnobs };

// Tone identity shared across themes when Sync is on.
export const SYNC_KEYS: (keyof Knobs)[] = ["pH", "pC", "bgH"];

// Background tints (applied at the active theme's own lightness). `hue: null`
// means "follow the brand hue".
export const BG_PRESETS: { name: string; hue: number | null; chroma: number }[] = [
  { name: "Neutro", hue: 118, chroma: 0.003 },
  { name: "Cálido", hue: 70, chroma: 0.011 },
  { name: "Frío papel", hue: 250, chroma: 0.007 },
  { name: "Marca", hue: null, chroma: 0.011 },
];

export const DEFAULTS: LabState = {
  light: {
    pL: 0.564,
    pC: 0.151,
    pH: 116,
    bgL: 0.981,
    bgC: 0.003,
    bgH: 118,
    cardL: 0.997,
    fgL: 0.207,
    mfL: 0.48,
    borderL: 0.881,
  },
  dark: {
    pL: 0.897,
    pC: 0.149,
    pH: 116,
    bgL: 0.159,
    bgC: 0.0,
    bgH: 0,
    cardL: 0.2,
    fgL: 0.967,
    mfL: 0.712,
    borderL: 0.274,
  },
  global: { radius: 0, shadow: 1 },
};

export const PRESETS: { name: string; pC: number; pH: number }[] = [
  { name: "Oliva actual", pC: 0.151, pH: 116 },
  { name: "Lima dorado", pC: 0.165, pH: 110 },
  { name: "Verde bosque", pC: 0.14, pH: 150 },
  { name: "Ámbar", pC: 0.15, pH: 85 },
  { name: "Esmeralda", pC: 0.145, pH: 162 },
  { name: "Cian técnico", pC: 0.12, pH: 200 },
];

const o = (L: number, C: number, H: number) =>
  `oklch(${L.toFixed(4)} ${C.toFixed(4)} ${H.toFixed(1)})`;

// Full token set derived from the knobs. Neutral surfaces carry a faint tint
// of the brand hue so light mode reads as designed, not flat grayscale.
export function deriveTokens(t: Knobs): Record<string, string> {
  const isDark = t.bgL < 0.5;
  const pf = t.pL >= 0.62 ? "oklch(0.2100 0.0100 285.0)" : "oklch(0.9851 0 0)";
  const surfH = t.pH;
  const mutedL = isDark
    ? Math.min(0.3, t.cardL + 0.02)
    : Math.max(0, t.cardL - 0.038);
  const secL = isDark
    ? Math.min(0.34, t.cardL + 0.11)
    : Math.max(0, t.borderL + 0.057);
  const accL = isDark
    ? Math.min(0.3, t.cardL + 0.05)
    : Math.max(0, t.cardL - 0.05);
  const inputL = isDark ? accL : t.borderL + 0.057;
  const dest = isDark
    ? "oklch(0.3958 0.1331 25.723)"
    : "oklch(0.5771 0.2152 27.325)";
  const fg = o(t.fgL, 0.01, 285);
  const neutralFg = o(isDark ? 0.985 : 0.21, 0.006, 285);

  return {
    background: o(t.bgL, t.bgC, t.bgH),
    foreground: fg,
    card: o(t.cardL, 0.0042, surfH),
    "card-foreground": fg,
    popover: o(t.cardL, 0.0042, surfH),
    "popover-foreground": fg,
    primary: o(t.pL, t.pC, t.pH),
    "primary-foreground": pf,
    secondary: o(secL, 0.008, surfH),
    "secondary-foreground": neutralFg,
    muted: o(mutedL, 0.0066, surfH),
    "muted-foreground": o(t.mfL, 0.012, 285),
    accent: o(accL, 0.0144, surfH),
    "accent-foreground": neutralFg,
    destructive: dest,
    "destructive-foreground": "oklch(0.9851 0 0)",
    border: o(t.borderL, 0.0084, surfH),
    input: o(inputL, 0.006, surfH),
    ring: o(t.pL, t.pC, t.pH),
    "chart-1": o(t.pL, t.pC, t.pH),
    "chart-2": o(isDark ? 0.686 : 0.633, 0.105, (t.pH + 38) % 360),
    "chart-3": o(isDark ? 0.585 : 0.594, 0.086, (t.pH + 82) % 360),
    "chart-4": o(isDark ? 0.486 : 0.556, 0.097, (t.pH + 122) % 360),
    "chart-5": o(isDark ? 0.388 : 0.612, 0.03, 285),
    sidebar: o(isDark ? t.bgL : t.bgL + 0.009, t.bgC, t.bgH),
    "sidebar-foreground": fg,
    "sidebar-primary": o(t.pL, t.pC, t.pH),
    "sidebar-primary-foreground": pf,
    "sidebar-accent": o(accL, 0.0144, surfH),
    "sidebar-accent-foreground": neutralFg,
    "sidebar-border": o(t.borderL, 0.0084, surfH),
    "sidebar-ring": o(t.pL, t.pC, t.pH),
  };
}

// Lightness for `primary` that reaches the target contrast vs background.
// Light themes darken the accent, dark themes lighten it; returns best effort
// when the target is unreachable for the current hue/chroma.
export function lightnessForAA(t: Knobs, target = 4.5): number {
  const bg: [number, number, number] = [t.bgL, t.bgC, t.bgH];
  const step = t.bgL < 0.5 ? 0.004 : -0.004;
  let pL = t.pL;
  for (let i = 0; i < 400; i++) {
    if (contrast([pL, t.pC, t.pH], bg) >= target) break;
    pL += step;
    if (pL <= 0.04 || pL >= 0.99) break;
  }
  return +Math.max(0.04, Math.min(0.99, pL)).toFixed(3);
}

const FONT_SERIF = `"Georgia", serif`;
const TRACKING = "0.024em";
const SPACING = "0.24rem";

export type Fonts = { sans: string; mono: string };
export const DEFAULT_FONTS: Fonts = {
  sans: "Chakra Petch, ui-sans-serif, sans-serif, system-ui",
  mono: "IBM Plex Mono, ui-monospace, monospace",
};

// The shadow scale, with each layer's opacity scaled by `strength` (1 = the
// values currently in globals.css).
export function shadowScale(strength: number): Record<string, string> {
  const op = (b: number) => +(b * strength).toFixed(3);
  const one = (o: number) => `0 1px 5px 0px hsl(0 0% 0% / ${op(o)})`;
  // Second layer keeps the exact offset/blur pairs from the base scale.
  const two = (dy: number, blur: number, o: number) =>
    `0 1px 5px 0px hsl(0 0% 0% / ${op(o)}), 0 ${dy}px ${blur}px -1px hsl(0 0% 0% / ${op(o)})`;
  return {
    "shadow-2xs": one(0.03),
    "shadow-xs": one(0.03),
    "shadow-sm": two(1, 2, 0.05),
    shadow: two(1, 2, 0.05),
    "shadow-md": two(2, 4, 0.05),
    "shadow-lg": two(4, 6, 0.05),
    "shadow-xl": two(8, 10, 0.05),
    "shadow-2xl": one(0.13),
  };
}

// Decorative gradients derived from the brand hue so they track the accent.
export function deriveGradients(t: Knobs): { aurora: string; codeGlow: string } {
  const isDark = t.bgL < 0.5;
  const aurora = isDark
    ? `linear-gradient(135deg, ${o(t.pL, t.pC, t.pH)} 0%, ${o(0.585, 0.1, (t.pH + 82) % 360)} 60%, ${o(0.16, 0, 0)} 100%)`
    : `linear-gradient(135deg, ${o(Math.min(0.86, t.pL + 0.28), t.pC * 0.9, t.pH)} 0%, ${o(0.633, 0.1, (t.pH + 38) % 360)} 55%, ${o(0.594, 0.086, (t.pH + 82) % 360)} 100%)`;
  const codeGlow = `radial-gradient(50% 50% at 50% 50%, color-mix(in oklch, ${o(t.pL, t.pC, t.pH)} ${isDark ? 20 : 18}%, transparent) 0%, transparent 100%)`;
  return { aurora, codeGlow };
}

function themeBlock(
  selector: string,
  t: Knobs,
  g: GlobalKnobs,
  fonts: Fonts,
  isRoot: boolean,
): string {
  const lines = Object.entries(deriveTokens(t)).map(([k, v]) => `  --${k}: ${v};`);
  lines.push(`  --font-sans: ${fonts.sans};`);
  lines.push(`  --font-serif: ${FONT_SERIF};`);
  lines.push(`  --font-mono: ${fonts.mono};`);
  lines.push(`  --radius: ${g.radius}rem;`);
  lines.push(
    `  --shadow-x: 0;`,
    `  --shadow-y: 1px;`,
    `  --shadow-blur: 5px;`,
    `  --shadow-spread: 0px;`,
    `  --shadow-opacity: ${+(0.05 * g.shadow).toFixed(3)};`,
    `  --shadow-color: #000000;`,
  );
  for (const [k, v] of Object.entries(shadowScale(g.shadow)))
    lines.push(`  --${k}: ${v};`);
  if (isRoot) {
    lines.push(`  --tracking-normal: ${TRACKING};`, `  --spacing: ${SPACING};`);
  }
  return `${selector} {\n${lines.join("\n")}\n}`;
}

function gradientBlock(selector: string, t: Knobs): string {
  const gr = deriveGradients(t);
  return `${selector} {\n  --gradient-aurora: ${gr.aurora};\n  --gradient-code-glow: ${gr.codeGlow};\n}`;
}

// Just the active theme's color+meta block (used by "copy active theme").
export function cssBlock(
  selector: string,
  t: Knobs,
  g: GlobalKnobs,
  fonts: Fonts,
): string {
  return themeBlock(selector, t, g, fonts, selector === ":root");
}

// Full drop-in export: both theme blocks plus both gradient blocks, labelled.
export function exportGlobals(state: LabState, fonts: Fonts): string {
  return [
    "/* ── Reemplaza el bloque :root de colores/tokens en globals.css ── */",
    themeBlock(":root", state.light, state.global, fonts, true),
    "",
    "/* ── Reemplaza el bloque .dark ── */",
    themeBlock(".dark", state.dark, state.global, fonts, false),
    "",
    "/* ── Reemplaza el segundo bloque :root (gradientes decorativos) ── */",
    gradientBlock(":root", state.light),
    "",
    "/* ── Reemplaza el segundo bloque .dark (gradientes) ── */",
    gradientBlock(".dark", state.dark),
  ].join("\n");
}
