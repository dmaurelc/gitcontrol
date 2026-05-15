"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FileEdit,
  FileMinus,
  FilePlus2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { RepoCommitFile } from "@/lib/github/service";
import { DiffViewer } from "./diff-viewer";

type Props = {
  file: RepoCommitFile;
  defaultOpen?: boolean;
};

function statusIcon(status: RepoCommitFile["status"]) {
  if (status === "added") return FilePlus2;
  if (status === "removed") return FileMinus;
  return FileEdit;
}

function statusColor(status: RepoCommitFile["status"]) {
  if (status === "added") return "text-emerald-500";
  if (status === "removed") return "text-red-500";
  if (status === "renamed") return "text-sky-500";
  return "text-amber-500";
}

export function FileDiffItem({ file, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);
  const isBinary = file.patch === undefined && file.status !== "renamed";

  const renderStatusIcon = () => {
    const Icon = statusIcon(file.status);
    return <Icon className={cn("size-3.5 shrink-0", statusColor(file.status))} />;
  };

  async function copyPath(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(file.filename);
      setCopied(true);
      toast.success("Path copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Clipboard unavailable");
    }
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="flex w-full items-center gap-2 bg-muted/30 px-2 py-1.5 text-xs">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left transition-colors hover:opacity-80"
        >
          {open ? (
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          {renderStatusIcon()}
          <span className="truncate font-mono">
            {file.previous_filename && file.previous_filename !== file.filename
              ? `${file.previous_filename} → ${file.filename}`
              : file.filename}
          </span>
        </button>
        <button
          type="button"
          onClick={copyPath}
          title="Copy path"
          aria-label="Copy path"
          className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-background hover:text-primary"
        >
          {copied ? (
            <Check className="size-3 text-emerald-500" />
          ) : (
            <Copy className="size-3" />
          )}
        </button>
        <span className="flex shrink-0 items-center gap-1 text-[10px]">
          {file.additions > 0 ? (
            <span className="text-emerald-500">+{file.additions}</span>
          ) : null}
          {file.deletions > 0 ? (
            <span className="text-red-500">-{file.deletions}</span>
          ) : null}
        </span>
      </div>
      {open ? (
        isBinary ? (
          <p className="px-3 py-2 text-xs italic text-muted-foreground">
            Binary file changed.
          </p>
        ) : (
          <DiffViewer patch={file.patch} />
        )
      ) : null}
    </div>
  );
}
