import { cn } from "@/lib/utils";
import { HyperText } from "@/components/hyper-text";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** Disable the scramble effect (e.g. dynamic titles like repo names). */
  plain?: boolean;
};

export function PageHeader({
  title,
  description,
  action,
  className,
  plain = false,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {plain ? title : <HyperText text={title} />}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
