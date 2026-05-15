// Local PR shape used in the explorer left panel. Service returns `unknown[]`,
// so we narrow to just the fields we render to avoid casting everywhere.
export type ExplorerPr = {
  number: number;
  title: string;
  state: "open" | "closed";
  draft?: boolean;
  user: { login: string; avatar_url: string } | null;
  head: { ref: string; sha: string };
  base: { ref: string };
  html_url: string;
  updated_at: string;
};
