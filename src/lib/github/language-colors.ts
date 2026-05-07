// Subset of GitHub's linguist colors. Falls back to neutral gray for unknowns.
// Source: github/linguist/lib/linguist/languages.yml (kept small; YAGNI).

const COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  Java: "#b07219",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  PHP: "#4F5D95",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Shell: "#89e051",
  Dart: "#00B4AB",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Astro: "#ff5a03",
  Lua: "#000080",
  Elixir: "#6e4a7e",
  Haskell: "#5e5086",
  Clojure: "#db5855",
  Scala: "#c22d40",
  Zig: "#ec915c",
  Nix: "#7e7eff",
  Markdown: "#083fa1",
  Dockerfile: "#384d54",
  MDX: "#fcb32c",
  Solidity: "#AA6746",
  R: "#198CE7",
  Perl: "#0298c3",
  ObjectiveC: "#438eff",
  "Objective-C": "#438eff",
};

export function getLanguageColor(language: string | null | undefined): string {
  if (!language) return "var(--muted-foreground)";
  return COLORS[language] ?? "#94a3b8";
}
