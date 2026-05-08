"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  PER_PAGE_OPTIONS,
  DEFAULT_PER_PAGE,
  clampPerPage,
} from "@/lib/pagination/per-page";
import type { Workflow } from "@/lib/github/service";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "queued", label: "Queued" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

type Props = {
  owner: string;
  repo: string;
  workflows: Workflow[];
};

export function RunsFilters({ owner, repo, workflows }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(name: string, value: string) {
    const next = new URLSearchParams(params);
    if (value && value !== "__any__") next.set(name, value);
    else next.delete(name);
    next.delete("page");
    startTransition(() => {
      router.push(
        `/repositories/${owner}/${repo}/actions?${next.toString()}`,
        { scroll: false },
      );
    });
  }

  return (
    <div
      data-pending={pending ? "" : undefined}
      className="flex flex-col gap-2 rounded-xl border bg-card/50 p-3 shadow-soft transition-opacity data-[pending]:opacity-60 md:flex-row md:items-center md:flex-wrap"
    >
      {/* Status filter */}
      <Select
        value={params.get("status") ?? "all"}
        onValueChange={(v) => update("status", v === "all" ? "" : v)}
        disabled={pending}
      >
        <SelectTrigger className="md:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Workflow filter */}
      {workflows.length > 0 && (
        <Select
          value={params.get("workflow") ?? "__any__"}
          onValueChange={(v) => update("workflow", v === "__any__" ? "" : v)}
          disabled={pending}
        >
          <SelectTrigger className="md:w-[220px]">
            <SelectValue placeholder="All workflows" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__any__">All workflows</SelectItem>
            {workflows.map((w) => (
              <SelectItem key={w.id} value={String(w.id)}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Branch filter */}
      <Input
        defaultValue={params.get("branch") ?? ""}
        placeholder="Filter by branch…"
        className="md:max-w-[200px]"
        disabled={pending}
        onBlur={(e) => update("branch", e.target.value.trim())}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            update("branch", (e.target as HTMLInputElement).value.trim());
          }
        }}
      />

      {/* Per-page selector */}
      <Select
        value={String(clampPerPage(params.get("perPage")))}
        onValueChange={(v) => {
          if (v === String(DEFAULT_PER_PAGE)) update("perPage", "");
          else update("perPage", v);
        }}
        disabled={pending}
      >
        <SelectTrigger className="md:ml-auto md:w-[120px]">
          <SelectValue placeholder="Per page" />
        </SelectTrigger>
        <SelectContent>
          {PER_PAGE_OPTIONS.map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n} / page
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
