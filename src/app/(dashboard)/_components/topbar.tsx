import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/app/actions/auth";
import { OrgSwitcher } from "./org-switcher";
import { MobileSidebar } from "./mobile-sidebar";
import { ThemeToggleIcon } from "@/components/theme-toggle-icon";
import type { ActiveContext } from "@/lib/context/active-context";

type TopbarProps = {
  user: {
    name: string;
    email: string;
    image: string | null;
    login: string;
  };
  orgs: Array<{ login: string; avatar_url: string }>;
  activeContext: ActiveContext;
};

export function Topbar({ user, orgs, activeContext }: TopbarProps) {
  const initials = (user.name || user.login).slice(0, 2).toUpperCase();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
      <MobileSidebar user={user} />
      <div className="hidden md:block">
        <OrgSwitcher
          userLogin={user.login}
          orgs={orgs}
          activeLogin={activeContext.login}
        />
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 md:justify-between">
        <div className="hidden flex-1 max-w-md md:block">
          <button
            type="button"
            disabled
            aria-label="Search (coming soon)"
            className="group flex h-9 w-full items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
          >
            <Search className="size-4" />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="pointer-events-none hidden select-none items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="md:hidden">
            <OrgSwitcher
              userLogin={user.login}
              orgs={orgs}
              activeLogin={activeContext.login}
            />
          </div>

          <div className="hidden md:block">
            <ThemeToggleIcon />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Account menu"
              className="inline-flex size-10 items-center justify-center rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Avatar className="size-8 ring-2 ring-border">
                {user.image ? (
                  <AvatarImage src={user.image} alt={user.name} />
                ) : null}
                <AvatarFallback className="text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="flex items-center gap-3 py-2">
                <Avatar className="size-8">
                  {user.image ? (
                    <AvatarImage src={user.image} alt={user.name} />
                  ) : null}
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">
                    {user.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <form action={signOutAction}>
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full text-left">
                    Sign out
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
