import Link from "next/link";
import { Folder, File, FileCode, FileText, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { RepoDirEntry } from "@/lib/github/service";

type Props = {
  owner: string;
  repo: string;
  parentPath: string;
  entries: RepoDirEntry[];
  refValue?: string;
};

const CODE_EXTENSIONS = new Set([
  "ts", "tsx", "js", "jsx", "mjs", "cjs",
  "py", "rb", "go", "rs", "java", "kt", "kts", "swift",
  "c", "cc", "cpp", "h", "hpp", "cs", "php", "sh", "bash",
  "json", "yml", "yaml", "toml", "xml", "css", "scss", "less", "html",
  "sql", "graphql", "prisma",
]);
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "ico", "bmp"]);

function fileIconFor(name: string): React.ComponentType<{ className?: string }> {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (CODE_EXTENSIONS.has(ext)) return FileCode;
  if (IMAGE_EXTENSIONS.has(ext)) return ImageIcon;
  if (ext === "md" || ext === "txt" || ext === "rst") return FileText;
  return File;
}

function formatSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DirListing({ owner, repo, parentPath, entries, refValue }: Props) {
  const sorted = [...entries].sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  const base = `/repositories/${owner}/${repo}/files`;
  const refQuery = refValue ? `&ref=${encodeURIComponent(refValue)}` : "";
  const showParent = parentPath !== "";
  const parentDir = parentPath.split("/").slice(0, -1).join("/");

  return (
    <Card className="shadow-card">
      <CardContent className="p-0">
        <ul className="divide-y divide-border/60">
          {showParent ? (
            <li>
              <Link
                href={
                  parentDir
                    ? `${base}?path=${encodeURIComponent(parentDir)}${refQuery}`
                    : refValue
                      ? `${base}?ref=${encodeURIComponent(refValue)}`
                      : base
                }
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted/60"
              >
                <Folder className="size-4 shrink-0 text-muted-foreground" />
                <span className="font-mono text-muted-foreground">..</span>
              </Link>
            </li>
          ) : null}
          {sorted.map((entry) => {
            const Icon = entry.type === "dir" ? Folder : fileIconFor(entry.name);
            const href = `${base}?path=${encodeURIComponent(entry.path)}${refQuery}`;
            return (
              <li key={entry.sha}>
                <Link
                  href={href}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted/60"
                >
                  <Icon
                    className={
                      entry.type === "dir"
                        ? "size-4 shrink-0 text-chart-1"
                        : "size-4 shrink-0 text-muted-foreground"
                    }
                  />
                  <span className="flex-1 truncate font-mono">{entry.name}</span>
                  {entry.type === "file" ? (
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatSize(entry.size)}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
