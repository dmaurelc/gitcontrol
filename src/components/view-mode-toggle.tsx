"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import { setViewModeAction } from "@/app/actions/view-mode";
import type { ViewMode, ViewModeScope } from "@/lib/preferences/get-user-preferences";
import { cn } from "@/lib/utils";

type Props = {
  scope: ViewModeScope;
  current: ViewMode;
};

export function ViewModeToggle({ scope, current }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function set(mode: ViewMode) {
    if (mode === current || pending) return;
    startTransition(async () => {
      await setViewModeAction(scope, mode);
      // revalidatePath invalidates the server cache; router.refresh forces
      // the client to fetch the new RSC payload so `current` updates.
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label="View mode"
      data-pending={pending ? "" : undefined}
      className="inline-flex h-8 items-center gap-0.5 rounded-md border bg-background p-0.5 transition-opacity data-[pending]:opacity-60"
    >
      <ToggleButton
        active={current === "grid"}
        disabled={pending}
        ariaLabel="Grid view"
        onClick={() => set("grid")}
      >
        <LayoutGrid className="size-3.5" />
      </ToggleButton>
      <ToggleButton
        active={current === "list"}
        disabled={pending}
        ariaLabel="List view"
        onClick={() => set("list")}
      >
        <List className="size-3.5" />
      </ToggleButton>
    </div>
  );
}

function ToggleButton({
  children,
  active,
  disabled,
  ariaLabel,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  disabled: boolean;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {children}
    </button>
  );
}
