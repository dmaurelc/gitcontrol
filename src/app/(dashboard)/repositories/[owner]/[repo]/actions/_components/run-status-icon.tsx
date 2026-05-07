import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  MinusCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowRunStatus, WorkflowRunConclusion } from "@/lib/github/service";

type Props = {
  status: WorkflowRunStatus | null;
  conclusion: WorkflowRunConclusion;
  className?: string;
  /** If true, renders spinning animation for in_progress */
  animate?: boolean;
};

/**
 * Maps a workflow run status + conclusion to a colored icon.
 * completed/success → green check
 * completed/failure → red x
 * completed/cancelled → gray slash
 * in_progress → amber spinning loader
 * queued/waiting/pending → gray clock
 */
export function RunStatusIcon({ status, conclusion, className, animate = true }: Props) {
  const base = cn("size-4 shrink-0", className);

  if (status === "completed") {
    if (conclusion === "success") {
      return <CheckCircle2 className={cn(base, "text-green-500")} />;
    }
    if (conclusion === "failure") {
      return <XCircle className={cn(base, "text-red-500")} />;
    }
    if (conclusion === "cancelled") {
      return <MinusCircle className={cn(base, "text-muted-foreground")} />;
    }
    if (conclusion === "skipped") {
      return <MinusCircle className={cn(base, "text-muted-foreground/60")} />;
    }
    // neutral / timed_out / action_required
    return <AlertCircle className={cn(base, "text-amber-500")} />;
  }

  if (status === "in_progress") {
    return (
      <Loader2
        className={cn(base, "text-amber-400", animate && "animate-spin")}
      />
    );
  }

  // queued / waiting / requested / pending / null
  return <Clock className={cn(base, "text-muted-foreground")} />;
}
