"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reRunWorkflowAction } from "@/app/actions/workflow-runs";

type Props = {
  owner: string;
  repo: string;
  runId: number;
  disabled?: boolean;
};

export function RerunButton({ owner, repo, runId, disabled }: Props) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const fd = new FormData();
    fd.set("owner", owner);
    fd.set("repo", repo);
    fd.set("run_id", String(runId));
    startTransition(async () => {
      const res = await reRunWorkflowAction(fd);
      if (res.ok) {
        toast.success("Workflow encolado para re-ejecutarse");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || pending}
      onClick={handleClick}
      className="gap-1.5"
    >
      <RefreshCw className={pending ? "size-3.5 animate-spin" : "size-3.5"} />
      {pending ? "Re-ejecutando…" : "Re-run"}
    </Button>
  );
}
