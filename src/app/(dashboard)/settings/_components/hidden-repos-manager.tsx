"use client";
import { useMemo, useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  hideRepoAction,
  unhideRepoAction,
} from "@/app/actions/visibility";

export type RepoEntry = {
  full_name: string;
  owner: string;
  ownerAvatar: string;
  isPrivate: boolean;
};

type Props = {
  initialHidden: string[];
  repos: RepoEntry[];
  viewerLogin: string;
};

export function HiddenReposManager({
  initialHidden,
  repos,
  viewerLogin,
}: Props) {
  const [hidden, setHidden] = useState<Set<string>>(
    () => new Set(initialHidden),
  );
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<Set<string>>(() => new Set());
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const owners = useMemo(() => {
    const set = new Set(repos.map((r) => r.owner));
    return Array.from(set).sort((a, b) => {
      if (a === viewerLogin) return -1;
      if (b === viewerLogin) return 1;
      return a.localeCompare(b);
    });
  }, [repos, viewerLogin]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return repos.filter((r) => {
      if (filter === "mine" && r.owner !== viewerLogin) return false;
      if (filter !== "all" && filter !== "mine" && r.owner !== filter)
        return false;
      if (q && !r.full_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [repos, filter, search, viewerLogin]);

  const grouped = useMemo(() => {
    const map = new Map<string, RepoEntry[]>();
    for (const r of filtered) {
      const arr = map.get(r.owner) ?? [];
      arr.push(r);
      map.set(r.owner, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === viewerLogin) return -1;
      if (b === viewerLogin) return 1;
      return a.localeCompare(b);
    });
  }, [filtered, viewerLogin]);

  function toggle(fullName: string) {
    const isHidden = hidden.has(fullName);
    const next = new Set(hidden);
    const newBusy = new Set(busy);
    newBusy.add(fullName);
    if (isHidden) next.delete(fullName);
    else next.add(fullName);
    setHidden(next);
    setBusy(newBusy);
    startTransition(async () => {
      try {
        if (isHidden) await unhideRepoAction(fullName);
        else await hideRepoAction(fullName);
      } finally {
        setBusy((prev) => {
          const n = new Set(prev);
          n.delete(fullName);
          return n;
        });
      }
    });
  }

  function bulkToggle(group: RepoEntry[], hide: boolean) {
    const targets = group.filter((r) =>
      hide ? !hidden.has(r.full_name) : hidden.has(r.full_name),
    );
    if (targets.length === 0) return;
    const next = new Set(hidden);
    const newBusy = new Set(busy);
    targets.forEach((r) => {
      if (hide) next.add(r.full_name);
      else next.delete(r.full_name);
      newBusy.add(r.full_name);
    });
    setHidden(next);
    setBusy(newBusy);
    startTransition(async () => {
      try {
        await Promise.all(
          targets.map((r) =>
            hide ? hideRepoAction(r.full_name) : unhideRepoAction(r.full_name),
          ),
        );
      } finally {
        setBusy((prev) => {
          const n = new Set(prev);
          targets.forEach((r) => n.delete(r.full_name));
          return n;
        });
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative md:max-w-xs md:flex-1">
          <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name…"
            className="pl-7"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <FilterChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All ({repos.length})
          </FilterChip>
          <FilterChip
            active={filter === "mine"}
            onClick={() => setFilter("mine")}
          >
            Mine ({repos.filter((r) => r.owner === viewerLogin).length})
          </FilterChip>
          {owners
            .filter((o) => o !== viewerLogin)
            .map((o) => (
              <FilterChip
                key={o}
                active={filter === o}
                onClick={() => setFilter(o)}
              >
                {o} ({repos.filter((r) => r.owner === o).length})
              </FilterChip>
            ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {hidden.size} hidden of {repos.length} total. Pinned repos override
        these settings.
      </p>

      {grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No repositories match the current filters.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(([owner, group]) => {
            const allHidden = group.every((r) => hidden.has(r.full_name));
            const noneHidden = group.every((r) => !hidden.has(r.full_name));
            const groupAvatar = group[0].ownerAvatar;
            return (
              <div
                key={owner}
                className="flex flex-col gap-2 rounded-md border p-3"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarImage src={groupAvatar} alt={owner} />
                    <AvatarFallback>
                      {owner.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{owner}</span>
                  {owner === viewerLogin ? (
                    <Badge variant="secondary" className="text-[10px]">
                      you
                    </Badge>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    {group.length} repo{group.length === 1 ? "" : "s"}
                  </span>
                  <div className="ml-auto flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={allHidden || pending}
                      onClick={() => bulkToggle(group, true)}
                    >
                      Hide all
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={noneHidden || pending}
                      onClick={() => bulkToggle(group, false)}
                    >
                      Show all
                    </Button>
                  </div>
                </div>
                <ul className="flex flex-col divide-y">
                  {group.map((r) => {
                    const isHidden = hidden.has(r.full_name);
                    const isBusy = busy.has(r.full_name);
                    return (
                      <li
                        key={r.full_name}
                        className="flex items-center gap-3 py-2"
                      >
                        <Checkbox
                          checked={isHidden}
                          disabled={isBusy}
                          onCheckedChange={() => toggle(r.full_name)}
                          id={`h-${r.full_name}`}
                        />
                        <label
                          htmlFor={`h-${r.full_name}`}
                          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm"
                        >
                          <span className="truncate">
                            {r.full_name.split("/")[1]}
                          </span>
                          {r.isPrivate ? (
                            <Badge
                              variant="outline"
                              className="text-[10px]"
                            >
                              private
                            </Badge>
                          ) : null}
                        </label>
                        {isBusy ? (
                          <Loader2 className="size-3 animate-spin text-muted-foreground" />
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full border px-2.5 py-1 text-xs transition-colors " +
        (active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted")
      }
    >
      {children}
    </button>
  );
}
