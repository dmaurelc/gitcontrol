"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pinRepoAction, unpinRepoAction } from "@/app/actions/settings";

export function PinButton({
  fullName,
  pinned,
}: {
  fullName: string;
  pinned: boolean;
}) {
  const [pending, startTransition] = useTransition();
  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const res = pinned
        ? await unpinRepoAction(fullName)
        : await pinRepoAction(fullName);
      if (res.ok) {
        toast.success(pinned ? "Repositorio desfijado" : "Repositorio fijado");
      } else {
        toast.error(res.error);
      }
    });
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7"
      onClick={toggle}
      disabled={pending}
      aria-label={pinned ? "Unpin repository" : "Pin repository"}
      title={pinned ? "Unpin" : "Pin"}
    >
      {pinned ? (
        <PinOff className="size-3.5" />
      ) : (
        <Pin className="size-3.5" />
      )}
    </Button>
  );
}
