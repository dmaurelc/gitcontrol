"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions/result";

type Props = {
  action: (formData: FormData) => Promise<ActionResult>;
  owner: string;
  repo: string;
  number: number;
  label: string;
  successMessage: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "sm" | "default" | "lg" | "icon";
};

/**
 * Button that submits owner/repo/number to a server action returning
 * ActionResult and shows a toast on success/error. Used for close/reopen
 * issue/PR flows.
 */
export function StateToggleButton({
  action,
  owner,
  repo,
  number,
  label,
  successMessage,
  variant = "outline",
  size = "sm",
}: Props) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const fd = new FormData();
    fd.set("owner", owner);
    fd.set("repo", repo);
    fd.set("number", String(number));
    startTransition(async () => {
      const res = await action(fd);
      if (res.ok) {
        toast.success(successMessage);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={pending}
      onClick={handleClick}
    >
      {pending ? "Procesando…" : label}
    </Button>
  );
}
