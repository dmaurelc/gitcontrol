import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, ExternalLink, ShieldAlert } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

const TYPES = ["container", "npm", "maven", "rubygems", "nuget"] as const;
type PkgType = (typeof TYPES)[number];

type Pkg = {
  id: number;
  name: string;
  package_type: string;
  visibility: string;
  html_url: string;
  updated_at: string;
};

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: PkgType }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");
  const sp = await searchParams;
  const type: PkgType = (TYPES as readonly string[]).includes(sp.type ?? "")
    ? (sp.type as PkgType)
    : "container";

  let items: Pkg[] = [];
  let permissionError = false;
  try {
    const res = await githubService.listPackages(session.user.id, type);
    items = res.data as unknown as Pkg[];
  } catch (err) {
    if ((err as { status?: number }).status === 403) permissionError = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Packages"
        description="Packages published to GitHub Packages."
      />
      <div className="flex flex-wrap items-center gap-2">
        {TYPES.map((t) => (
          <Button
            key={t}
            asChild
            size="sm"
            variant={t === type ? "default" : "outline"}
          >
            <Link href={`/packages?type=${t}`}>{t}</Link>
          </Button>
        ))}
      </div>
      {permissionError ? (
        <EmptyState
          icon={ShieldAlert}
          title="GitHub denied access"
          description={
            <>
              The OAuth App needs the{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                read:packages
              </code>{" "}
              scope.
            </>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title={`No ${type} packages found`}
          description="Try switching the package type above."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => (
            <Card
              key={p.id}
              className="p-0 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <CardContent className="flex h-full flex-col gap-3 p-5">
                <div className="flex items-center gap-2">
                  <div className="grid size-7 place-items-center rounded-md bg-chart-3/15 text-chart-3">
                    <Package className="size-3.5" />
                  </div>
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase">
                    {p.package_type}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase">
                    {p.visibility}
                  </span>
                  <span className="ml-auto text-[11px] tabular-nums">
                    {new Date(p.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <a
                  href={p.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto inline-flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Open on GitHub <ExternalLink className="size-3" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
