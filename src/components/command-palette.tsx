"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  Star,
  KanbanSquare,
  Package,
  Settings,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import type { Repo } from "@/lib/github/service";

type QuickLink = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const QUICK_LINKS: QuickLink[] = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/repositories", label: "Repositories", Icon: GitBranch },
  { href: "/stars", label: "Stars", Icon: Star },
  { href: "/projects", label: "Projects", Icon: KanbanSquare },
  { href: "/packages", label: "Packages", Icon: Package },
  { href: "/settings", label: "Settings", Icon: Settings },
];

type CommandPaletteProps = {
  repos: Pick<Repo, "id" | "full_name" | "description" | "language" | "private">[];
};

export function CommandPalette({ repos }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  // Global keyboard shortcut: ⌘K / Ctrl+K
  // Excluded when focus is inside an input/textarea/contenteditable.
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!e.key || e.key.toLowerCase() !== "k") return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      setOpen((prev) => !prev);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      {/* Topbar search button — clicking opens the palette */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command palette (⌘K)"
        className="group flex h-9 w-full items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex-1 text-left">Search…</span>
        <kbd className="pointer-events-none hidden select-none items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Command Palette" description="Search repos and navigate pages">
        <CommandInput placeholder="Search repos and pages…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Quick links">
            {QUICK_LINKS.map(({ href, label, Icon }) => (
              <CommandItem
                key={href}
                value={label}
                onSelect={() => navigate(href)}
              >
                <Icon className="size-4" />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>

          {repos.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Repositories">
                {repos.map((repo) => (
                  <CommandItem
                    key={repo.id}
                    value={repo.full_name}
                    onSelect={() => navigate(`/repositories/${repo.full_name}`)}
                  >
                    <GitBranch className="size-4" />
                    <span className="flex-1 truncate">{repo.full_name}</span>
                    {repo.private && (
                      <span className="ml-auto text-[0.6875rem] text-muted-foreground">
                        private
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
