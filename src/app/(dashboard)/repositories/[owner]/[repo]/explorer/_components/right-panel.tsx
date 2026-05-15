import { FileDiff } from "lucide-react";

type Props = {
  children?: React.ReactNode;
  hasCommit: boolean;
};

export function RightPanel({ children, hasCommit }: Props) {
  if (!hasCommit) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
        <div className="grid size-10 place-items-center rounded-full bg-muted">
          <FileDiff className="size-4" />
        </div>
        <p className="font-medium text-foreground">No commit selected</p>
        <p className="text-xs">Pick a commit from the timeline to see changes.</p>
      </div>
    );
  }
  return <>{children}</>;
}
