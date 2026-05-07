"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const SORTS = [
  { value: "created-desc", label: "Recently starred" },
  { value: "created-asc", label: "Oldest starred" },
  { value: "updated-desc", label: "Recently updated" },
  { value: "stars-desc", label: "Most stars (this page)" },
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

export function StarsFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(name: string, value: string) {
    const next = new URLSearchParams(params);
    if (value && value !== "__any__") next.set(name, value);
    else next.delete(name);
    next.delete("page");
    startTransition(() => {
      router.push(`/stars?${next.toString()}`);
    });
  }

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
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
        value={params.get("sort") ?? "created-desc"}
        onValueChange={(v) => update("sort", v)}
        disabled={pending}
      >
        <SelectTrigger className="md:w-[220px]">
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
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Filter by name…"
      className="md:max-w-xs"
    />
  );
}
