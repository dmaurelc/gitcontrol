"use client";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateDefaultViewAction } from "@/app/actions/settings";

const VIEWS = [
  { value: "dashboard", label: "Dashboard (overview)" },
  { value: "repositories", label: "Repositories" },
  { value: "stars", label: "Stars" },
];

export function DefaultViewSelect({ value }: { value: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        startTransition(() => {
          void updateDefaultViewAction(v);
        });
      }}
      disabled={pending}
    >
      <SelectTrigger className="w-full md:w-[280px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {VIEWS.map((v) => (
          <SelectItem key={v.value} value={v.value}>
            {v.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
