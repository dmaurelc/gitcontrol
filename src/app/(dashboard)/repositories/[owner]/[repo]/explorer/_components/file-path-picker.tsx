"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { File, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { listBranchFilesAction } from "@/app/actions/repo-edit";

type Props = {
  owner: string;
  repo: string;
  branch: string;
  value: string;
  onChange: (path: string) => void;
  disabled?: boolean;
};

// Async-loaded path picker. Lazy-loads the full branch tree on first focus
// (server-cached 5 min), then filters in-memory while the user types.
export function FilePathPicker({
  owner,
  repo,
  branch,
  value,
  onChange,
  disabled,
}: Props) {
  const [paths, setPaths] = useState<string[] | null>(null);
  const [loading, startLoad] = useTransition();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function loadTree() {
    if (paths !== null || loading) return;
    startLoad(async () => {
      const res = await listBranchFilesAction({ owner, repo, branch });
      if (!res.ok) {
        toast.error(res.error);
        setPaths([]);
        return;
      }
      setPaths(res.data?.paths ?? []);
      if (res.data?.truncated) {
        toast.info("Repo tree is large — some files may be missing.");
      }
    });
  }

  const suggestions = useMemo(() => {
    if (!paths || !value.trim()) return [];
    const q = value.toLowerCase();
    const hits: string[] = [];
    for (const p of paths) {
      if (p.toLowerCase().includes(q)) {
        hits.push(p);
        if (hits.length >= 12) break;
      }
    }
    return hits;
  }, [paths, value]);

  function pick(p: string) {
    onChange(p);
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(suggestions.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = suggestions[active];
      if (pick) onChange(pick);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        placeholder="src/path/to/file.ts"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => {
          loadTree();
          setOpen(true);
        }}
        onBlur={() => {
          // delay so click on list registers before close
          setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={onKeyDown}
        autoComplete="off"
        spellCheck={false}
      />
      {loading ? (
        <Loader2 className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : null}
      {open && suggestions.length > 0 ? (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
          {suggestions.map((p, i) => (
            <li key={p}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(p);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex w-full items-center gap-1.5 rounded-sm px-2 py-1 text-left text-xs",
                  i === active
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent",
                )}
              >
                <File className="size-3 shrink-0 text-muted-foreground" />
                <span className="truncate font-mono">{p}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
