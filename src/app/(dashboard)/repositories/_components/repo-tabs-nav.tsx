"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function RepoTabsNav({
  owner,
  repo,
}: {
  owner: string;
  repo: string;
}) {
  const pathname = usePathname();
  const base = `/repositories/${owner}/${repo}`;
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/files`, label: "Files" },
    { href: `${base}/commits`, label: "Commits" },
    { href: `${base}/issues`, label: "Issues" },
    { href: `${base}/pulls`, label: "Pull requests" },
    { href: `${base}/actions`, label: "Actions" },
    { href: `${base}/dependencies`, label: "Dependencies" },
    { href: `${base}/insights`, label: "Insights" },
  ];
  return (
    <div className="border-b">
      <nav className="-mb-px flex gap-4 text-sm">
        {tabs.map((t) => {
          const active =
            pathname === t.href ||
            (t.href !== base && pathname.startsWith(t.href));
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "border-b-2 px-1 pb-2 transition-colors",
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
