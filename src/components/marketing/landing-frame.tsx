import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Outer landing wrapper: hairline border + corner crosshairs.
 * Inner content uses the existing background; the frame just adds a
 * 1px border with `+` markers at every corner and section intersection.
 */
export function LandingFrame({ children, className }: Props) {
  return (
    <div className="relative bg-background">
      <div
        className={cn(
          "relative mx-auto px-6 border-x border-border md:px-10 lg:px-16",
          className,
        )}
      >
        <CornerMark className="left-0 top-0 -translate-x-1/2 -translate-y-1/2" />
        <CornerMark className="right-0 top-0 translate-x-1/2 -translate-y-1/2" />
        <CornerMark className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
        <CornerMark className="bottom-0 right-0 translate-x-1/2 translate-y-1/2" />
        {children}
      </div>
    </div>
  );
}

function CornerMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute z-20 grid size-4 place-items-center text-primary",
        className,
      )}
    >
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current" />
    </span>
  );
}

/**
 * Inline divider between sections: full-width border with `+` marks
 * where the divider meets the frame's vertical borders. Negative margins
 * cancel the parent frame's horizontal padding so the line reaches the edge.
 */
export function FrameDivider() {
  return (
    <div
      aria-hidden
      className="relative -mx-6 border-b border-border md:-mx-10 lg:-mx-16"
    >
      <CornerMark className="left-0 top-0 -translate-x-1/2 -translate-y-1/2" />
      <CornerMark className="right-0 top-0 translate-x-1/2 -translate-y-1/2" />
    </div>
  );
}
