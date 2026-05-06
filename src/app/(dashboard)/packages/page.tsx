import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  if (!session) redirect("/login");
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
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Packages</h1>
        <p className="text-sm text-muted-foreground">
          Packages published to GitHub Packages.
        </p>
      </div>
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
        <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          GitHub denied access. The OAuth App needs the
          <code className="mx-1 rounded bg-muted px-1 py-0.5">read:packages</code>
          scope.
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          No <strong>{type}</strong> packages found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex h-full flex-col gap-2 p-4">
                <div className="flex items-center gap-2">
                  <Package className="size-4 text-muted-foreground" />
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{p.package_type}</span>
                  <span>{p.visibility}</span>
                  <span className="ml-auto">
                    {new Date(p.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <a
                  href={p.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto flex items-center gap-1 text-xs hover:underline"
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
