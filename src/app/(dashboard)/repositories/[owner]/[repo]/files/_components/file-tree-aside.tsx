"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ChevronRight,
  File,
  FileCode,
  FileText,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RepoDirEntry } from "@/lib/github/service";
import { listRepoDirAction } from "@/app/actions/repo-contents";

type Props = {
  owner: string;
  repo: string;
  rootEntries: RepoDirEntry[];
  selectedPath: string;
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

function FileIcon({ name, className }: { name: string; className?: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (CODE_EXTENSIONS.has(ext)) return <FileCode className={className} />;
  if (IMAGE_EXTENSIONS.has(ext)) return <ImageIcon className={className} />;
  if (ext === "md" || ext === "txt" || ext === "rst")
    return <FileText className={className} />;
  return <File className={className} />;
}

function sortEntries(entries: RepoDirEntry[]): RepoDirEntry[] {
  return [...entries].sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function ancestorsOf(path: string): string[] {
  if (!path) return [];
  const parts = path.split("/");
  const out: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    out.push(parts.slice(0, i).join("/"));
  }
  return out;
}

export function FileTreeAside({
  owner,
  repo,
  rootEntries,
  selectedPath,
  refValue,
}: Props) {
  const base = `/repositories/${owner}/${repo}/files`;
  const refQuery = refValue ? `&ref=${encodeURIComponent(refValue)}` : "";

  const [childrenByPath, setChildrenByPath] = useState<
    Record<string, RepoDirEntry[]>
  >({ "": rootEntries });
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    return new Set(ancestorsOf(selectedPath));
  });
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  const loadChildren = useCallback(
    (path: string) => {
      if (childrenByPath[path] || loading.has(path)) return;
      setLoading((prev) => new Set(prev).add(path));
      startTransition(async () => {
        const result = await listRepoDirAction({ owner, repo, path, ref: refValue });
        setLoading((prev) => {
          const next = new Set(prev);
          next.delete(path);
          return next;
        });
        if (result.ok && result.data) {
          setChildrenByPath((prev) => ({ ...prev, [path]: result.data! }));
          setErrors((prev) => {
            if (!prev[path]) return prev;
            const next = { ...prev };
            delete next[path];
            return next;
          });
        } else {
          setErrors((prev) => ({
            ...prev,
            [path]: result.ok ? "Empty." : result.error,
          }));
        }
      });
    },
    [childrenByPath, loading, owner, repo, refValue],
  );

  const loadChildrenRef = useRef(loadChildren);
  useEffect(() => {
    loadChildrenRef.current = loadChildren;
  }, [loadChildren]);

  useEffect(() => {
    const ancestors = ancestorsOf(selectedPath);
    if (ancestors.length === 0) return;
    const id = setTimeout(() => {
      for (const ancestor of ancestors) loadChildrenRef.current(ancestor);
    }, 0);
    return () => clearTimeout(id);
  }, [selectedPath]);

  const toggle = useCallback(
    (path: string) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        return next;
      });
      if (!childrenByPath[path]) loadChildren(path);
    },
    [childrenByPath, loadChildren],
  );

  const sortedRoot = useMemo(() => sortEntries(rootEntries), [rootEntries]);

  return (
    <aside className="w-full lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:w-72 lg:shrink-0 lg:overflow-y-auto">
      <div className="rounded-lg border bg-card shadow-card">
        <div className="border-b px-3 py-2">
          <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
            Tree
          </p>
        </div>
        <ul className="py-1 text-sm">
          <RootRow base={base} selected={selectedPath} refQuery={refQuery} />
          {sortedRoot.map((entry) => (
            <TreeNode
              key={entry.sha}
              entry={entry}
              depth={0}
              base={base}
              refQuery={refQuery}
              selectedPath={selectedPath}
              expanded={expanded}
              loading={loading}
              errors={errors}
              childrenByPath={childrenByPath}
              onToggle={toggle}
            />
          ))}
        </ul>
      </div>
    </aside>
  );
}

function RootRow({
  base,
  selected,
  refQuery,
}: {
  base: string;
  selected: string;
  refQuery: string;
}) {
  const isActive = selected === "";
  return (
    <li>
      <Link
        href={`${base}${refQuery ? `?${refQuery.slice(1)}` : ""}`}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 font-mono text-xs transition-colors hover:bg-muted/60",
          isActive && "bg-muted text-foreground",
        )}
      >
        <FolderOpen className="size-4 shrink-0 text-chart-1" />
        <span className="truncate">/</span>
      </Link>
    </li>
  );
}

type NodeProps = {
  entry: RepoDirEntry;
  depth: number;
  base: string;
  refQuery: string;
  selectedPath: string;
  expanded: Set<string>;
  loading: Set<string>;
  errors: Record<string, string>;
  childrenByPath: Record<string, RepoDirEntry[]>;
  onToggle: (path: string) => void;
};

function TreeNode({
  entry,
  depth,
  base,
  refQuery,
  selectedPath,
  expanded,
  loading,
  errors,
  childrenByPath,
  onToggle,
}: NodeProps) {
  const isDir = entry.type === "dir";
  const isSelected = selectedPath === entry.path;
  const isOpen = isDir && expanded.has(entry.path);
  const childList = childrenByPath[entry.path];
  const isLoading = loading.has(entry.path);
  const error = errors[entry.path];
  const indent = { paddingLeft: `${0.5 + depth * 0.875}rem` } as const;

  const href = `${base}?path=${encodeURIComponent(entry.path)}${refQuery}`;

  return (
    <li>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 font-mono text-xs transition-colors hover:bg-muted/60",
          isSelected && "bg-muted text-foreground",
        )}
        style={indent}
      >
        {isDir ? (
          <button
            type="button"
            onClick={() => onToggle(entry.path)}
            aria-label={isOpen ? "Collapse" : "Expand"}
            className="-ml-1 grid size-4 shrink-0 place-items-center rounded hover:bg-muted"
          >
            <ChevronRight
              className={cn(
                "size-3 text-muted-foreground transition-transform",
                isOpen && "rotate-90",
              )}
            />
          </button>
        ) : (
          <span className="size-4 shrink-0" />
        )}
        {isDir ? (
          isOpen ? (
            <FolderOpen className="size-4 shrink-0 text-chart-1" />
          ) : (
            <Folder className="size-4 shrink-0 text-chart-1" />
          )
        ) : (
          <FileIcon
            name={entry.name}
            className="size-4 shrink-0 text-muted-foreground"
          />
        )}
        <Link href={href} className="flex-1 truncate hover:underline">
          {entry.name}
        </Link>
        {isLoading ? (
          <Loader2 className="size-3 shrink-0 animate-spin text-muted-foreground" />
        ) : null}
      </div>
      {isOpen ? (
        <ul>
          {error ? (
            <li
              className="px-2 py-1 text-[0.6875rem] text-destructive"
              style={{ paddingLeft: `${1.5 + depth * 0.875}rem` }}
            >
              {error}
            </li>
          ) : childList ? (
            sortEntries(childList).map((child) => (
              <TreeNode
                key={child.sha}
                entry={child}
                depth={depth + 1}
                base={base}
                refQuery={refQuery}
                selectedPath={selectedPath}
                expanded={expanded}
                loading={loading}
                errors={errors}
                childrenByPath={childrenByPath}
                onToggle={onToggle}
              />
            ))
          ) : !isLoading ? (
            <li
              className="px-2 py-1 text-[0.6875rem] text-muted-foreground"
              style={{ paddingLeft: `${1.5 + depth * 0.875}rem` }}
            >
              …
            </li>
          ) : null}
        </ul>
      ) : null}
    </li>
  );
}
