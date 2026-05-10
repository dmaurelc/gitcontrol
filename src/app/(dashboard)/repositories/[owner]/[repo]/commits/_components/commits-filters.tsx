"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, GitBranch, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { RepoBranchRef, RepoContributor } from "@/lib/github/service";

type Props = {
  owner: string;
  repo: string;
  branches: RepoBranchRef[];
  contributors: RepoContributor[];
  selectedBranch: string;
  selectedAuthor: string;
  since: string;
  until: string;
};

export function CommitsFilters({
  owner,
  repo,
  branches,
  contributors,
  selectedBranch,
  selectedAuthor,
  since,
  until,
}: Props) {
  const router = useRouter();
  const base = `/repositories/${owner}/${repo}/commits`;
  const [sinceLocal, setSinceLocal] = useState(since);
  const [untilLocal, setUntilLocal] = useState(until);

  const updateQuery = useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams();
      const merged: Record<string, string | undefined> = {
        branch: selectedBranch,
        author: selectedAuthor,
        since,
        until,
        ...patch,
      };
      // Reset page on filter change.
      delete merged.page;
      for (const [k, v] of Object.entries(merged)) {
        if (v && v.length > 0) params.set(k, v);
      }
      const qs = params.toString();
      router.push(qs ? `${base}?${qs}` : base);
    },
    [base, router, selectedAuthor, selectedBranch, since, until],
  );

  const selectedContributor = useMemo(
    () => contributors.find((c) => c.login === selectedAuthor) ?? null,
    [contributors, selectedAuthor],
  );

  const hasAnyFilter =
    Boolean(selectedAuthor) || Boolean(since) || Boolean(until);

  const applyDates = () => {
    updateQuery({
      since: sinceLocal || undefined,
      until: untilLocal || undefined,
    });
  };

  const clearAll = () => {
    setSinceLocal("");
    setUntilLocal("");
    updateQuery({ author: undefined, since: undefined, until: undefined });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Branch */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <GitBranch className="size-4" />
            <span className="font-mono text-xs">
              {selectedBranch || "branch"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-0">
          <Command>
            <CommandInput placeholder="Search branches..." />
            <CommandList>
              <CommandEmpty>No branches found.</CommandEmpty>
              <CommandGroup>
                {branches.map((b) => (
                  <CommandItem
                    key={b.name}
                    value={b.name}
                    onSelect={() => updateQuery({ branch: b.name })}
                    className={cn(
                      "font-mono text-xs",
                      b.name === selectedBranch && "bg-muted",
                    )}
                  >
                    {b.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Author */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <User className="size-4" />
            <span className="text-xs">
              {selectedContributor?.login ?? (selectedAuthor || "All users")}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-0">
          <Command>
            <CommandInput placeholder="Search users..." />
            <CommandList>
              <CommandEmpty>No contributors found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="__all__"
                  onSelect={() => updateQuery({ author: undefined })}
                  className={cn(
                    "text-xs",
                    !selectedAuthor && "bg-muted",
                  )}
                >
                  All users
                </CommandItem>
                {contributors.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.login}
                    onSelect={() => updateQuery({ author: c.login })}
                    className={cn(
                      "text-xs",
                      c.login === selectedAuthor && "bg-muted",
                    )}
                  >
                    <span className="truncate">{c.login}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Date range */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="size-4" />
            <span className="text-xs">
              {since || until
                ? `${since || "…"} → ${until || "…"}`
                : "All time"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 space-y-3 p-3">
          <div className="space-y-1.5">
            <label className="text-[0.6875rem] font-medium uppercase text-muted-foreground">
              Since
            </label>
            <Input
              type="date"
              value={sinceLocal}
              onChange={(e) => setSinceLocal(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[0.6875rem] font-medium uppercase text-muted-foreground">
              Until
            </label>
            <Input
              type="date"
              value={untilLocal}
              onChange={(e) => setUntilLocal(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSinceLocal("");
                setUntilLocal("");
                updateQuery({ since: undefined, until: undefined });
              }}
            >
              Clear
            </Button>
            <Button size="sm" onClick={applyDates}>
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {hasAnyFilter ? (
        <Button
          size="sm"
          variant="ghost"
          className="gap-1 text-muted-foreground"
          onClick={clearAll}
        >
          <X className="size-3" />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
