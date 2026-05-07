"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  Star,
  KanbanSquare,
  Package,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarUserCard } from "@/components/sidebar-user-card";

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
      { href: "/repositories", label: "Repositories", Icon: GitBranch },
      { href: "/stars", label: "Stars", Icon: Star },
    ],
  },
  {
    label: "GitHub",
    items: [
      { href: "/projects", label: "Projects", Icon: KanbanSquare },
      { href: "/packages", label: "Packages", Icon: Package },
    ],
  },
  {
    label: "System",
    items: [{ href: "/settings", label: "Settings", Icon: Settings }],
  },
];

type AppSidebarUser = {
  name: string;
  email: string;
  image: string | null;
  login: string;
};

type AppSidebarProps = {
  className?: string;
  onNavigate?: () => void;
  user?: AppSidebarUser;
};

export function AppSidebar({ className, onNavigate, user }: AppSidebarProps) {
  const pathname = usePathname();
  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-sidebar",
        className,
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
        <div className="grid size-7 place-items-center rounded-md bg-linear-to-br from-chart-1 to-chart-4 text-primary-foreground shadow-soft">
          <Sparkles className="size-3.5" />
        </div>
        <span className="text-sm font-semibold tracking-tight">MaurelDev</span>
      </div>
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
        {SECTIONS.map((section) => (
          <div key={section.label} className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground/80">
              {section.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map(({ href, label, Icon }) => {
                const active =
                  pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex min-h-11 items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all",
                      active
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-soft"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    {active ? (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                      />
                    ) : null}
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      {user ? (
        <div className="border-t border-sidebar-border p-3">
          <SidebarUserCard
            name={user.name}
            email={user.email}
            image={user.image}
            login={user.login}
          />
        </div>
      ) : null}
    </aside>
  );
}
