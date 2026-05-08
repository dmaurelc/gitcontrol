"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search } from "lucide-react";
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
import { ViewModeToggle } from "@/components/view-mode-toggle";
import type { ViewMode } from "@/lib/preferences/get-user-preferences";

const SORTS = [
  { value: "updated", label: "Recently updated" },
  { value: "pushed", label: "Recently pushed" },
  { value: "created", label: "Recently created" },
  { value: "full_name", label: "Name" },
];

const VISIBILITIES = [
  { value: "all", label: "All visibility" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

const LANGUAGES = [
  "All languages",
  "TypeScript",
  "JavaScript",
  "Python",
  "Go",
  "Rust",
  "Ruby",
  "PHP",
  "Java",
  "C#",
  "C++",
  "Swift",
  "Kotlin",
];

export function RepoFilters({ viewMode }: { viewMode: ViewMode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(name: string, value: string) {
    const next = new URLSearchParams(params);
    if (value && value !== "__any__") next.set(name, value);
    else next.delete(name);
    next.delete("page");
    startTransition(() => {
      router.push(`/repositories?${next.toString()}`, { scroll: false });
    });
  }

  function updatePerPage(value: string) {
    const next = new URLSearchParams(params);
    if (value === String(DEFAULT_PER_PAGE)) next.delete("perPage");
    else next.set("perPage", value);
    next.delete("page");
    startTransition(() => {
      router.push(`/repositories?${next.toString()}`, { scroll: false });
    });
  }

  const currentPerPage = String(clampPerPage(params.get("perPage")));

  return (
    <div
      data-pending={pending ? "" : undefined}
      className="flex flex-col gap-2 rounded-xl border bg-card/50 p-3 shadow-soft transition-opacity data-[pending]:opacity-60 md:flex-row md:items-center md:flex-wrap"
    >
      <DebouncedSearch
        initial={params.get("q") ?? ""}
        onChange={(v) => update("q", v.trim())}
      />
      <Select
        value={params.get("language") ?? "__any__"}
        onValueChange={(v) => update("language", v === "__any__" ? "" : v)}
        disabled={pending}
      >
        <SelectTrigger className="md:w-[180px]">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((l) => (
            <SelectItem key={l} value={l === "All languages" ? "__any__" : l}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={params.get("visibility") ?? "all"}
        onValueChange={(v) => update("visibility", v)}
        disabled={pending}
      >
        <SelectTrigger className="md:w-[160px]">
          <SelectValue placeholder="Visibility" />
        </SelectTrigger>
        <SelectContent>
          {VISIBILITIES.map((v) => (
            <SelectItem key={v.value} value={v.value}>
              {v.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={params.get("sort") ?? "updated"}
        onValueChange={(v) => update("sort", v)}
        disabled={pending}
      >
        <SelectTrigger className="md:w-[200px]">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          {SORTS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2 md:ml-auto">
        <Select
          value={currentPerPage}
          onValueChange={updatePerPage}
          disabled={pending}
        >
          <SelectTrigger className="md:w-[120px]">
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
        <ViewModeToggle scope="repos" current={viewMode} />
      </div>
    </div>
  );
}

function DebouncedSearch({
  initial,
  onChange,
}: {
  initial: string;
  onChange: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const lastSent = useRef(initial);

  useEffect(() => {
    const id = setTimeout(() => {
      if (value === lastSent.current) return;
      lastSent.current = value;
      onChange(value);
    }, 300);
    return () => clearTimeout(id);
  }, [value, onChange]);

  return (
    <div className="relative md:max-w-xs md:flex-1">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Filter by name…"
        className="pl-8"
      />
    </div>
  );
}
