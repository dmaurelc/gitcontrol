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
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/repositories", label: "Repositories", Icon: GitBranch },
  { href: "/stars", label: "Stars", Icon: Star },
  { href: "/projects", label: "Projects", Icon: KanbanSquare },
  { href: "/packages", label: "Packages", Icon: Package },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden border-r bg-sidebar md:flex md:flex-col">
      <div className="flex h-14 items-center px-5 font-semibold tracking-tight">
        MaurelDev
      </div>
      <nav className="flex flex-col gap-0.5 p-3">
        {NAV.map(({ href, label, Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
