"use client";
import { useSyncExternalStore, useTransition } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateThemeAction } from "@/app/actions/settings";

// Cycle order: light → dark → system → light
const CYCLE: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function ThemeIcon({ theme }: { theme: string | undefined }) {
  if (theme === "dark") return <Moon className="size-4" />;
  if (theme === "system") return <Monitor className="size-4" />;
  return <Sun className="size-4" />;
}

export function ThemeToggleIcon() {
  const { theme, setTheme } = useTheme();
  const [pending, startTransition] = useTransition();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function cycle() {
    const current = theme ?? "system";
    const currentIdx = CYCLE.indexOf(current as (typeof CYCLE)[number]);
    const next = CYCLE[(currentIdx + 1) % CYCLE.length];
    setTheme(next);
    startTransition(async () => {
      const res = await updateThemeAction(next);
      if (!res.ok) toast.error(res.error);
    });
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-9" disabled aria-label="Toggle theme">
        <Sun className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9"
      onClick={cycle}
      disabled={pending}
      aria-label={`Switch theme (current: ${theme ?? "system"})`}
    >
      <ThemeIcon theme={theme} />
    </Button>
  );
}
