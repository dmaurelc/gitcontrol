import { Skeleton } from "@/components/ui/skeleton";

export function BranchesListSkeleton() {
  return (
    <div className="flex flex-col gap-1 p-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-full" />
      ))}
    </div>
  );
}

export function CommitsListSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-start gap-2">
          <Skeleton className="size-5 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2 w-1/3" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

export function CommitDetailSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="size-7 shrink-0 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-8 w-1/3" />
      </div>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
