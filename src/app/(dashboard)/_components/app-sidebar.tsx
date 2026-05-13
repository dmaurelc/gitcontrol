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
  GitPullRequest,
  CircleAlert,
  Activity,
  ExternalLink,
  Bug,
  Newspaper,
} from "lucide-react";
import { GithubIcon } from "@/components/icons/github-icon";
import { NodeMark } from "@/components/icons/node-mark";
import { cn } from "@/lib/utils";
import { SidebarUserCard } from "@/components/sidebar-user-card";

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

function buildSections(login: string | undefined): NavSection[] {
  return [
    {
      label: "Workspace",
      items: [
        { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
        { href: "/repositories", label: "Repositories", Icon: GitBranch },
        { href: "/pulls", label: "Pull requests", Icon: GitPullRequest },
        { href: "/issues", label: "Issues", Icon: CircleAlert },
        { href: "/activity", label: "Activity", Icon: Activity },
        { href: "/stars", label: "Stars", Icon: Star },
      ],
    },
    {
      label: "GitHub",
      items: [
        { href: "/projects", label: "Projects", Icon: KanbanSquare },
        { href: "/packages", label: "Packages", Icon: Package },
        ...(login
          ? [
              {
                href: `https://github.com/${encodeURIComponent(login)}`,
                label: "GitHub",
                Icon: GithubIcon,
                external: true,
              } as NavItem,
            ]
          : []),
      ],
    },
    {
      label: "Project",
      items: [
        { href: "/changelog", label: "Changelog", Icon: Newspaper },
        { href: "/report-bug", label: "Report a bug", Icon: Bug },
      ],
    },
    {
      label: "System",
      items: [{ href: "/settings", label: "Settings", Icon: Settings }],
    },
  ];
}

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
  const SECTIONS = buildSections(user?.login);
  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-sidebar",
        className,
      )}
    >
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5 transition-colors hover:bg-sidebar-accent/40"
      >
        <NodeMark className="size-6 text-primary" />
        <span className="text-sm font-semibold tracking-tight">GitControl</span>
      </Link>
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
        {SECTIONS.map((section) => (
          <div key={section.label} className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground/80">
              {section.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map(({ href, label, Icon, external }) => {
                const active =
                  !external &&
                  (pathname === href || pathname.startsWith(`${href}/`));
                const className = cn(
                  "group relative flex min-h-11 items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-soft"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                );
                const iconCls = cn(
                  "size-4 shrink-0 transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground group-hover:text-foreground",
                );
                if (external) {
                  return (
                    <a
                      key={href}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      onClick={onNavigate}
                      className={className}
                    >
                      <Icon className={iconCls} />
                      <span className="truncate flex-1">{label}</span>
                      <ExternalLink className="size-3 shrink-0 text-muted-foreground/70" />
                    </a>
                  );
                }
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={className}
                  >
                    {active ? (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                      />
                    ) : null}
                    <Icon className={iconCls} />
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
