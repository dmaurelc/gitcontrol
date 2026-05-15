"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExplorerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface unexpected errors during dev — production logs go to the server.
    console.error("[explorer] render error", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-card/30 p-10 text-center">
      <div className="grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <div>
        <h3 className="text-sm font-semibold">Explorer crashed</h3>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          {error.message || "An unexpected error happened while rendering the explorer view."}
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={reset}>
        <RefreshCw className="mr-1.5 size-3.5" />
        Try again
      </Button>
    </div>
  );
}
