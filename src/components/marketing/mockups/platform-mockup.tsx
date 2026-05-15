import { Monitor, Moon, Sun, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const THEMES = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon, active: true },
  { id: "system", label: "System", Icon: Monitor },
];

export function PlatformMockup() {
  return (
    <div className="space-y-3 rounded-none bg-background p-4">
      <div className="flex gap-2 border-b border-border">
        <span className="border-b-2 border-primary px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider text-foreground">
          Appearance
        </span>
        <span className="px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Account
        </span>
      </div>

      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Theme
        </p>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(({ id, label, Icon, active }) => (
            <div
              key={id}
              className={cn(
                "flex flex-col items-center gap-2 rounded-none border bg-card p-3",
                active ? "border-primary" : "border-border",
              )}
            >
              <Icon
                className={cn(
                  "size-5",
                  active ? "text-primary" : "text-muted-foreground",
                )}
                strokeWidth={1.5}
              />
              <span className="font-sans text-xs text-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-none border border-destructive/40 bg-destructive/5 p-3">
        <div className="flex items-start gap-3">
          <Trash2
            className="mt-0.5 size-4 shrink-0 text-destructive"
            strokeWidth={1.5}
          />
          <div className="flex-1">
            <p className="font-sans text-xs text-foreground">
              Revoke GitHub access
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Wipes cache · deletes user · cascades sessions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
