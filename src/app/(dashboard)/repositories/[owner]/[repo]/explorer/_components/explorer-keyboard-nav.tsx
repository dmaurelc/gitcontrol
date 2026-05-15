"use client";

import { useEffect, useState } from "react";
import { Keyboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RepoCommit } from "@/lib/github/service";
import { useExplorerState } from "./use-explorer-state";

type Props = {
  commits: RepoCommit[];
};

// Wires j/k navigation across the commits timeline and a `?` shortcuts overlay.
// Kept tiny — heavy work (focus traps, more shortcuts) can grow later.
export function ExplorerKeyboardNav({ commits }: Props) {
  const { commit, setCommit } = useExplorerState();
  const [overlayOpen, setOverlayOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "?") {
        e.preventDefault();
        setOverlayOpen(true);
        return;
      }
      if (e.key === "Escape") {
        if (overlayOpen) {
          setOverlayOpen(false);
          return;
        }
        if (commit) setCommit("");
        return;
      }
      if (e.key !== "j" && e.key !== "k") return;
      if (commits.length === 0) return;

      const currentIdx = commits.findIndex((c) => c.sha === commit);
      let nextIdx: number;
      if (currentIdx === -1) {
        nextIdx = 0;
      } else {
        nextIdx =
          e.key === "j"
            ? Math.min(commits.length - 1, currentIdx + 1)
            : Math.max(0, currentIdx - 1);
      }
      const next = commits[nextIdx];
      if (next && next.sha !== commit) setCommit(next.sha);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commit, commits, overlayOpen, setCommit]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-3 top-3 z-10 h-7 gap-1 text-[10px] text-muted-foreground"
        onClick={() => setOverlayOpen(true)}
        aria-label="Keyboard shortcuts"
      >
        <Keyboard className="size-3" />
        <kbd className="rounded border bg-muted px-1 font-mono">?</kbd>
      </Button>

      {overlayOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setOverlayOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg border bg-card p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Keyboard shortcuts</h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => setOverlayOpen(false)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
            <ul className="space-y-2 text-xs">
              <ShortcutRow keyLabel="j" desc="Next commit" />
              <ShortcutRow keyLabel="k" desc="Previous commit" />
              <ShortcutRow keyLabel="Esc" desc="Clear commit selection" />
              <ShortcutRow keyLabel="?" desc="Show shortcuts" />
            </ul>
            <p className="mt-3 text-[10px] text-muted-foreground">
              Shortcuts are disabled while typing in inputs.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ShortcutRow({ keyLabel, desc }: { keyLabel: string; desc: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{desc}</span>
      <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
        {keyLabel}
      </kbd>
    </li>
  );
}
