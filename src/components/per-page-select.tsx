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
import {
  PER_PAGE_OPTIONS,
  DEFAULT_PER_PAGE,
  clampPerPage,
} from "@/lib/pagination/per-page";

type Props = {
  basePath: string;
  paramName?: string;
};

export function PerPageSelect({ basePath, paramName = "perPage" }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const current = String(clampPerPage(params.get(paramName)));

  function update(value: string) {
    const next = new URLSearchParams(params);
    if (value === String(DEFAULT_PER_PAGE)) next.delete(paramName);
    else next.set(paramName, value);
    next.delete("page");
    startTransition(() => {
      router.push(`${basePath}?${next.toString()}`);
    });
  }

  return (
    <Select value={current} onValueChange={update} disabled={pending}>
      <SelectTrigger className="h-8 w-[110px]">
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
  );
}
