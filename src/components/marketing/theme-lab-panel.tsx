"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useTheme } from "next-themes";
import { Dice5, Copy, RotateCcw, X, SlidersHorizontal, Wand2 } from "lucide-react";
import { oklchHex, contrast, aaTag } from "@/components/marketing/theme-lab/oklch-utils";
import {
  DEFAULTS,
  DEFAULT_FONTS,
  PRESETS,
  BG_PRESETS,
  SYNC_KEYS,
  deriveTokens,
  deriveGradients,
  shadowScale,
  cssBlock,
  exportGlobals,
  lightnessForAA,
  type Knobs,
  type GlobalKnobs,
  type LabState,
  type ThemeName,
} from "@/components/marketing/theme-lab/theme-tokens";

type SliderDef = { key: keyof Knobs; label: string; min: number; max: number; step: number; deg?: boolean; brand?: boolean };
const SLIDERS: { title: string; items: SliderDef[] }[] = [
  { title: "Marca · primary", items: [
    { key: "pL", label: "Lightness", min: 0, max: 1, step: 0.002, brand: true },
    { key: "pC", label: "Chroma (saturación)", min: 0, max: 0.3, step: 0.002, brand: true },
    { key: "pH", label: "Hue (tono)", min: 0, max: 360, step: 1, deg: true, brand: true },
  ] },
  { title: "Fondo · background", items: [
    { key: "bgL", label: "Lightness", min: 0, max: 1, step: 0.002 },
    { key: "bgC", label: "Chroma (tinte)", min: 0, max: 0.06, step: 0.001 },
    { key: "bgH", label: "Hue (tinte)", min: 0, max: 360, step: 1, deg: true },
  ] },
  { title: "Superficies y texto", items: [
    { key: "cardL", label: "Card", min: 0, max: 1, step: 0.002 },
    { key: "fgL", label: "Texto principal", min: 0, max: 1, step: 0.002 },
    { key: "mfL", label: "Texto secundario", min: 0, max: 1, step: 0.002 },
    { key: "borderL", label: "Borde", min: 0, max: 1, step: 0.002 },
  ] },
];

const fmt = (v: number, deg?: boolean) => (deg ? String(Math.round(v)) : v.toFixed(3));

// Client-only mount flag without setState-in-effect (matches ThemeToggle).
const subscribeMount = () => () => {};
const getMountSnapshot = () => true;
const getMountServerSnapshot = () => false;

export function ThemeLabPanel() {
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(true);
  const mounted = useSyncExternalStore(
    subscribeMount,
    getMountSnapshot,
    getMountServerSnapshot,
  );
  const [enabled] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("lab"),
  );
  const [sync, setSync] = useState(() => {
    try {
      return (
        typeof window !== "undefined" &&
        localStorage.getItem("gc-theme-lab-sync") === "1"
      );
    } catch {
      return false;
    }
  });
  const [state, setState] = useState<LabState>(() => {
    try {
      const s =
        typeof window !== "undefined"
          ? localStorage.getItem("gc-theme-lab")
          : null;
      if (s) {
        // Merge onto DEFAULTS so state persisted before a knob existed
        // (e.g. `global`) never yields undefined at read time.
        const parsed = JSON.parse(s) as Partial<LabState>;
        return {
          ...structuredClone(DEFAULTS),
          ...parsed,
          global: { ...DEFAULTS.global, ...(parsed.global ?? {}) },
        };
      }
    } catch {}
    return structuredClone(DEFAULTS);
  });

  const theme: ThemeName = resolvedTheme === "light" ? "light" : "dark";

  // Apply the active theme's derived tokens to :root, live.
  useEffect(() => {
    if (!enabled || !mounted) return;
    const t = state[theme];
    const root = document.documentElement;
    for (const [key, v] of Object.entries(deriveTokens(t)))
      root.style.setProperty(`--${key}`, v);
    root.style.setProperty("--radius", `${state.global.radius}rem`);
    for (const [key, v] of Object.entries(shadowScale(state.global.shadow)))
      root.style.setProperty(`--${key}`, v);
    const gr = deriveGradients(t);
    root.style.setProperty("--gradient-aurora", gr.aurora);
    root.style.setProperty("--gradient-code-glow", gr.codeGlow);
    try {
      localStorage.setItem("gc-theme-lab", JSON.stringify(state));
      localStorage.setItem("gc-theme-lab-sync", sync ? "1" : "0");
    } catch {}
  }, [enabled, mounted, state, theme, sync]);

  const update = useCallback(
    (patch: Partial<Knobs>, propagate: boolean) => {
      setState((prev) => {
        const next = structuredClone(prev);
        Object.assign(next[theme], patch);
        if (propagate) {
          const other: ThemeName = theme === "light" ? "dark" : "light";
          for (const k of SYNC_KEYS) next[other][k] = next[theme][k];
        }
        return next;
      });
    },
    [theme],
  );

  const toggleSync = () => {
    const on = !sync;
    setSync(on);
    if (on) update({}, true); // align the other theme to the active tone now
  };

  const randomize = () => {
    const pH = Math.round(Math.random() * 360);
    const pC = +(0.1 + Math.random() * 0.08).toFixed(3);
    const isDark = state[theme].bgL < 0.5;
    // Keep the background readable: tint + lightness stay in a safe band.
    const bgC = +(Math.random() * (isDark ? 0.006 : 0.008)).toFixed(3);
    const bgL = isDark
      ? +(0.14 + Math.random() * 0.05).toFixed(3)
      : +(0.965 + Math.random() * 0.03).toFixed(3);
    update({ pH, pC, bgH: pH, bgC, bgL }, sync);
  };

  const updateGlobal = (patch: Partial<GlobalKnobs>) =>
    setState((prev) => ({ ...prev, global: { ...prev.global, ...patch } }));

  const applyAA = () => update({ pL: lightnessForAA(state[theme]) }, false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      ta.remove();
    }
  };

  const k = state[theme];
  const contrasts = useMemo(() => {
    const cBg = contrast([k.pL, k.pC, k.pH], [k.bgL, k.bgC, k.bgH]);
    const cFg = contrast([k.fgL, 0.01, 285], [k.bgL, k.bgC, k.bgH]);
    return { cBg, cFg, aBg: aaTag(cBg), aFg: aaTag(cFg) };
  }, [k]);

  if (!enabled || !mounted) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[100] flex items-center gap-2 border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 shadow-xl hover:border-lime-400"
      >
        <SlidersHorizontal className="size-4" /> Theme Lab
      </button>
    );
  }

  const aaClass = (t: string) =>
    t === "pass" ? "bg-lime-950 text-lime-400" : t === "large" ? "bg-yellow-950 text-yellow-400" : "bg-red-950 text-red-400";

  return (
    <aside className="fixed bottom-4 right-4 z-[100] flex max-h-[92vh] w-[330px] flex-col overflow-hidden border border-zinc-700 bg-zinc-900 font-mono text-zinc-100 shadow-2xl">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="flex items-center gap-2 text-[13px] font-semibold tracking-wide">
          <span className="size-2 bg-lime-400" /> Theme Lab
        </span>
        <button onClick={() => setOpen(false)} aria-label="Cerrar" className="text-zinc-400 hover:text-zinc-100">
          <X className="size-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* theme tabs */}
        <div className="m-4 mb-2 grid grid-cols-2 border border-zinc-700">
          {(["light", "dark"] as ThemeName[]).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`py-2 text-[11px] uppercase tracking-widest ${theme === t ? "bg-lime-400 font-semibold text-zinc-950" : "text-zinc-400"} ${t === "dark" ? "border-l border-zinc-700" : ""}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* sync + random */}
        <div className="mx-4 mb-3 flex items-center justify-between gap-2">
          <button onClick={toggleSync} className="flex items-center gap-2 text-[11px] text-zinc-200">
            <span className={`relative h-[18px] w-[34px] transition-colors ${sync ? "bg-lime-400" : "bg-zinc-700"}`}>
              <span className={`absolute top-0.5 size-[14px] transition-all ${sync ? "left-[18px] bg-zinc-950" : "left-0.5 bg-zinc-400"}`} />
            </span>
            Sync light ↔ dark
          </button>
          <button onClick={randomize} className="flex items-center gap-1.5 border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-[11px] hover:border-lime-400 active:bg-lime-400 active:text-zinc-950">
            <Dice5 className="size-3.5" /> Random
          </button>
        </div>

        {/* swatches + contrast */}
        <div className="mx-4 mb-2 flex gap-2">
          <Swatch label="primary" hex={oklchHex(k.pL, k.pC, k.pH)} dark={k.pL < 0.62} />
          <Swatch label="bg" hex={oklchHex(k.bgL, k.bgC, k.bgH)} dark={k.bgL >= 0.5} />
          <Swatch label="card" hex={oklchHex(k.cardL, 0.004, k.pH)} dark={k.cardL >= 0.5} />
        </div>
        <div className="mx-4 mb-2 grid grid-cols-2 gap-2">
          <ContrastBox title="primary / bg" ratio={contrasts.cBg} tag={contrasts.aBg} cls={aaClass} />
          <ContrastBox title="texto / bg" ratio={contrasts.cFg} tag={contrasts.aFg} cls={aaClass} />
        </div>
        <div className="mx-4 mb-3">
          <button onClick={applyAA} className="flex w-full items-center justify-center gap-1.5 border border-zinc-700 bg-zinc-800 py-1.5 text-[11px] text-zinc-200 hover:border-lime-400">
            <Wand2 className="size-3.5" /> Ajustar primary a AA (4.5:1)
          </button>
        </div>

        {/* presets */}
        <div className="mx-4 mb-1 text-[10px] uppercase tracking-[0.16em] text-zinc-500">Presets de tono</div>
        <div className="mx-4 mb-3 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => update({ pC: p.pC, pH: p.pH, bgH: p.pH }, sync)}
              className="flex items-center gap-1.5 border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-[10px] hover:border-lime-400"
            >
              <span className="size-[11px] border border-white/15" style={{ background: oklchHex(k.pL, p.pC, p.pH) }} />
              {p.name}
            </button>
          ))}
        </div>

        <div className="mx-4 mb-1 text-[10px] uppercase tracking-[0.16em] text-zinc-500">Presets de fondo</div>
        <div className="mx-4 mb-3 flex flex-wrap gap-1.5">
          {BG_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => update({ bgH: p.hue ?? k.pH, bgC: p.chroma }, false)}
              className="flex items-center gap-1.5 border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-[10px] hover:border-lime-400"
            >
              <span className="size-[11px] border border-white/15" style={{ background: oklchHex(k.bgL, p.chroma, p.hue ?? k.pH) }} />
              {p.name}
            </button>
          ))}
        </div>

        {/* sliders */}
        {SLIDERS.map((grp) => (
          <div key={grp.title} className="px-4 pb-1 pt-2">
            <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-zinc-500">{grp.title}</div>
            {grp.items.map((s) => (
              <div key={s.key} className="mb-3">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-[11px] text-zinc-200">{s.label}</span>
                  <span className="text-[11px] tabular-nums text-zinc-400">{fmt(k[s.key], s.deg)}</span>
                </div>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={k[s.key]}
                  onChange={(e) => update({ [s.key]: parseFloat(e.target.value) } as Partial<Knobs>, sync && SYNC_KEYS.includes(s.key))}
                  className={`w-full ${s.brand ? "accent-lime-400" : "accent-zinc-300"}`}
                />
              </div>
            ))}
          </div>
        ))}

        {/* radius + shadow (shared across themes) */}
        <div className="px-4 pb-1 pt-2">
          <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-zinc-500">Radio y sombras</div>
          <div className="mb-3">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-[11px] text-zinc-200">Radius (esquinas)</span>
              <span className="text-[11px] tabular-nums text-zinc-400">{state.global.radius.toFixed(2)}rem</span>
            </div>
            <input type="range" min={0} max={1.5} step={0.05} value={state.global.radius} onChange={(e) => updateGlobal({ radius: parseFloat(e.target.value) })} className="w-full accent-zinc-300" />
          </div>
          <div className="mb-3">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-[11px] text-zinc-200">Intensidad de sombra</span>
              <span className="text-[11px] tabular-nums text-zinc-400">{state.global.shadow.toFixed(1)}×</span>
            </div>
            <input type="range" min={0} max={3} step={0.1} value={state.global.shadow} onChange={(e) => updateGlobal({ shadow: parseFloat(e.target.value) })} className="w-full accent-zinc-300" />
          </div>
        </div>

      </div>

      {/* actions */}
      <div className="flex flex-col gap-2 border-t border-zinc-800 p-4">
        <button onClick={() => copy(cssBlock(theme === "light" ? ":root" : ".dark", state[theme], state.global, DEFAULT_FONTS))} className="bg-lime-400 py-2.5 text-center text-[11px] font-semibold tracking-wide text-zinc-950 hover:bg-lime-300">
          Copiar bloque del tema activo
        </button>
        <div className="flex gap-2">
          <button onClick={() => copy(exportGlobals(state, DEFAULT_FONTS))} className="flex flex-1 items-center justify-center gap-1.5 border border-zinc-700 bg-zinc-800 py-2 text-[11px] hover:border-lime-400">
            <Copy className="size-3.5" /> Export completo
          </button>
          <button onClick={() => { setState(structuredClone(DEFAULTS)); }} className="flex items-center justify-center gap-1.5 border border-zinc-700 bg-zinc-800 px-3 py-2 text-[11px] text-zinc-300 hover:border-lime-400" title="Restaurar valores actuales">
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function Swatch({ label, hex, dark }: { label: string; hex: string; dark: boolean }) {
  return (
    <div className="flex h-11 flex-1 items-end border border-zinc-700 px-1.5 py-1 text-[9px] uppercase tracking-wider" style={{ background: hex, color: dark ? "#e4e4e7" : "#18181b" }}>
      {label}
    </div>
  );
}

function ContrastBox({ title, ratio, tag, cls }: { title: string; ratio: number; tag: { label: string; tone: string }; cls: (t: string) => string }) {
  return (
    <div className="border border-zinc-800 px-2.5 py-2 text-[10px] text-zinc-400">
      {title}
      <b className="mt-0.5 block text-[13px] font-semibold text-zinc-100">{ratio.toFixed(2)}:1</b>
      <span className={`mt-1 inline-block px-1.5 py-px text-[9px] ${cls(tag.tone)}`}>{tag.label}</span>
    </div>
  );
}
