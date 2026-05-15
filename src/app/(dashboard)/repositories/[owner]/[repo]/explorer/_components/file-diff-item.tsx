"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FileEdit, FileMinus, FilePlus2 } from "lucide-react";
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
  const isBinary = file.patch === undefined && file.status !== "renamed";

  const renderStatusIcon = () => {
    const Icon = statusIcon(file.status);
    return <Icon className={cn("size-3.5 shrink-0", statusColor(file.status))} />;
  };

  return (
    <div className="overflow-hidden rounded-md border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 bg-muted/30 px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted/50"
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
        <span className="ml-auto flex shrink-0 items-center gap-1 text-[10px]">
          {file.additions > 0 ? (
            <span className="text-emerald-500">+{file.additions}</span>
          ) : null}
          {file.deletions > 0 ? (
            <span className="text-red-500">-{file.deletions}</span>
          ) : null}
        </span>
      </button>
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
