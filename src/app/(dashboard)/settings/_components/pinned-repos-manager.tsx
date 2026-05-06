"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { X, Pin, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pinRepoAction, unpinRepoAction } from "@/app/actions/settings";

export function PinnedReposManager({ pinned }: { pinned: string[] }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function add() {
    const fullName = value.trim();
    setError(null);
    if (!/^[\w.-]+\/[\w.-]+$/.test(fullName)) {
      setError("Format: owner/repo");
      return;
    }
    if (pinned.includes(fullName)) {
      setError("Already pinned");
      return;
    }
    startTransition(() => {
      void pinRepoAction(fullName).then(() => setValue(""));
    });
  }

  function remove(fullName: string) {
    startTransition(() => {
      void unpinRepoAction(fullName);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <Input
          placeholder="owner/repo"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="md:max-w-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button onClick={add} disabled={pending} size="sm">
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Pin repository
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {pinned.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No pinned repositories yet.
        </p>
      ) : (
        <ul className="flex flex-col divide-y rounded-md border">
          {pinned.map((p) => (
            <li
              key={p}
              className="flex items-center gap-3 p-3 text-sm"
            >
              <Pin className="size-4 text-muted-foreground" />
              <Link
                href={`/repositories/${p}`}
                className="truncate font-medium hover:underline"
              >
                {p}
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto"
                onClick={() => remove(p)}
                disabled={pending}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
