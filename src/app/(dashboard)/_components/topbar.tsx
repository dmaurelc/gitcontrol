import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutMenuItem } from "@/components/sign-out-menu-item";
import { OrgSwitcher } from "./org-switcher";
import { MobileSidebar } from "./mobile-sidebar";
import { ThemeToggleIcon } from "@/components/theme-toggle-icon";
import { NotificationsBell } from "@/components/notifications-bell";
import { CommandPaletteServer } from "@/components/command-palette-server";
import { githubService } from "@/lib/github/service";
import type { ActiveContext } from "@/lib/context/active-context";
import type { GitHubNotification } from "@/lib/github/service";

type TopbarProps = {
  user: {
    name: string;
    email: string;
    image: string | null;
    login: string;
  };
  userId: string;
  orgs: Array<{ login: string; avatar_url: string }>;
  activeContext: ActiveContext;
};

export async function Topbar({ user, userId, orgs, activeContext }: TopbarProps) {
  // Fetch notifications server-side; on error (missing scope etc.) render empty list.
  let notifications: GitHubNotification[] = [];
  try {
    const res = await githubService.listNotifications(userId);
    notifications = res.data;
  } catch {
    // empty list — bell still renders without badge
  }
  const initials = (user.name || user.login).slice(0, 2).toUpperCase();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-9xl items-center gap-3 px-4 md:px-6">
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
          <CommandPaletteServer userId={userId} />
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="md:hidden">
            <OrgSwitcher
              userLogin={user.login}
              orgs={orgs}
              activeLogin={activeContext.login}
            />
          </div>

          <div className="hidden md:flex md:items-center md:gap-1">
            <NotificationsBell initialNotifications={notifications} />
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
              <SignOutMenuItem />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      </div>
    </header>
  );
}
