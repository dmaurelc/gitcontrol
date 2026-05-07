"use client";
import { useSyncExternalStore, useTransition } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateThemeAction } from "@/app/actions/settings";

const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [pending, startTransition] = useTransition();
  const mounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  function pick(value: (typeof OPTIONS)[number]["value"]) {
    setTheme(value);
    startTransition(async () => {
      const res = await updateThemeAction(value);
      if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {OPTIONS.map(({ value, label, Icon }) => (
        <Button
          key={value}
          size="sm"
          variant={mounted && theme === value ? "default" : "outline"}
          onClick={() => pick(value)}
          disabled={pending || !mounted}
        >
          <Icon className="size-4" />
          {label}
        </Button>
      ))}
    </div>
  );
}
