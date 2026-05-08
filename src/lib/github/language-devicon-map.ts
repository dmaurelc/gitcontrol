/**
 * Maps a GitHub `language` value to its devicon icon slug.
 * https://devicon.dev — icons are served from
 * `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/<slug>/<slug>-original.svg`
 *
 * Add new entries when a real repo surfaces an unmapped language.
 */
export const LANGUAGE_DEVICON_MAP: Record<string, string> = {
  TypeScript: "typescript",
  JavaScript: "javascript",
  Python: "python",
  Go: "go",
  Rust: "rust",
  Ruby: "ruby",
  PHP: "php",
  Java: "java",
  Kotlin: "kotlin",
  Swift: "swift",
  "C#": "csharp",
  "C++": "cplusplus",
  C: "c",
  Shell: "bash",
  Bash: "bash",
  HTML: "html5",
  CSS: "css3",
  SCSS: "sass",
  Sass: "sass",
  Less: "less",
  Vue: "vuejs",
  Svelte: "svelte",
  Dart: "dart",
  Lua: "lua",
  R: "r",
  Scala: "scala",
  Elixir: "elixir",
  Erlang: "erlang",
  Haskell: "haskell",
  Clojure: "clojure",
  Perl: "perl",
  "Objective-C": "objectivec",
  Solidity: "solidity",
  Dockerfile: "docker",
  Makefile: "gnu",
  TeX: "latex",
  Markdown: "markdown",
  Astro: "astro",
  GraphQL: "graphql",
  Nix: "nixos",
  PowerShell: "powershell",
};

export function deviconSlug(language: string | null | undefined): string | null {
  if (!language) return null;
  return LANGUAGE_DEVICON_MAP[language] ?? null;
}

const CDN_BASE =
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons";

export function deviconUrl(slug: string): string {
  return `${CDN_BASE}/${slug}/${slug}-original.svg`;
}
