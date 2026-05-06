"use client";
import { useTransition } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateThemeAction } from "@/app/actions/settings";

const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [pending, startTransition] = useTransition();

  function pick(value: (typeof OPTIONS)[number]["value"]) {
    setTheme(value);
    startTransition(() => {
      void updateThemeAction(value);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {OPTIONS.map(({ value, label, Icon }) => (
        <Button
          key={value}
          size="sm"
          variant={theme === value ? "default" : "outline"}
          onClick={() => pick(value)}
          disabled={pending}
        >
          <Icon className="size-4" />
          {label}
        </Button>
      ))}
    </div>
  );
}
