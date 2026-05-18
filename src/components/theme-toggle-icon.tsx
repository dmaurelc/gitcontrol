"use client";
import { useSyncExternalStore, useTransition } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateThemeAction } from "@/app/actions/settings";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function ThemeIcon({ theme }: { theme: string | undefined }) {
  if (theme === "light") return <Sun className="size-4" />;
  return <Moon className="size-4" />;
}

export function ThemeToggleIcon() {
  const { theme, setTheme } = useTheme();
  const [pending, startTransition] = useTransition();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    startTransition(async () => {
      const res = await updateThemeAction(next);
      if (!res.ok) toast.error(res.error);
    });
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-9" disabled aria-label="Toggle theme">
        <Moon className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9"
      onClick={toggle}
      disabled={pending}
      aria-label={`Switch theme (current: ${theme ?? "dark"})`}
    >
      <ThemeIcon theme={theme} />
    </Button>
  );
}
