"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  years: number[];
  /** Currently selected year, or undefined for "Last 12 months". */
  current?: number;
  /** Search-param key. Defaults to "contribYear". */
  paramKey?: string;
};

const ROLLING_VALUE = "rolling";

/** Client-side select that updates a search param to filter the heatmap. */
export function ContributionYearSelect({
  years,
  current,
  paramKey = "contribYear",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === ROLLING_VALUE) {
      params.delete(paramKey);
    } else {
      params.set(paramKey, next);
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  const value = current ? String(current) : ROLLING_VALUE;

  return (
    <Select value={value} onValueChange={onChange} disabled={pending}>
      <SelectTrigger size="sm" className="h-7 w-[120px] text-xs">
        <SelectValue placeholder="Last 12 months" />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value={ROLLING_VALUE}>Last 12 months</SelectItem>
        {years.map((y) => (
          <SelectItem key={y} value={String(y)}>
            {y}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
