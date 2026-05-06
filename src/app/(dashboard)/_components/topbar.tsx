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
    <header className="flex h-14 items-center justify-between gap-4 border-b px-6">
      <OrgSwitcher
        userLogin={user.login}
        orgs={orgs}
        activeLogin={activeContext.login}
      />
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="size-8">
            {user.image ? (
              <AvatarImage src={user.image} alt={user.name} />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
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
    </header>
  );
}
