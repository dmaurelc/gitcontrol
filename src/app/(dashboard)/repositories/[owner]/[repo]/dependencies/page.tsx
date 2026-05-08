import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getDependencyManifests } from "@/lib/github/dependencies";
import { getNpmLatest } from "@/lib/registries/npm-registry";
import {
  computeOutdated,
  type OutdatedResult,
} from "@/lib/dependencies/compute-outdated";
import type {
  RepoDependency,
  RepoManifest,
} from "@/lib/github/dependencies";
import { ManifestCard } from "./_components/manifest-card";
import { CreateOutdatedIssueDialog } from "./_components/create-outdated-issue-dialog";

type SP = { filter?: "all" | "outdated" };

export type DependencyRow = {
  dep: RepoDependency;
  outdated: OutdatedResult;
};

export type ManifestWithRows = {
  manifest: RepoManifest;
  rows: DependencyRow[];
};

export default async function DependenciesPage({
  params,
  searchParams,
}: {
  params: Promise<{ owner: string; repo: string }>;
  searchParams: Promise<SP>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const { owner, repo } = await params;
  const sp = await searchParams;
  const filter: "all" | "outdated" = sp.filter === "outdated" ? "outdated" : "all";

  const manifests = await getDependencyManifests(session.user.id, owner, repo);

  // Resolve latest for npm deps in parallel (cached at TTL.npmLatest).
  // Other ecosystems are listed but not version-checked in v1.
  const npmDeps = manifests.flatMap((m) =>
    m.dependencies
      .filter((d) => d.ecosystem === "NPM")
      .map((d) => d.packageName),
  );
  const uniqueNpmDeps = Array.from(new Set(npmDeps));
  const npmLatestMap = new Map<string, string | null>();
  await Promise.all(
    uniqueNpmDeps.map(async (name) => {
      const r = await getNpmLatest(session.user.id, name);
      npmLatestMap.set(name, r?.version ?? null);
    }),
  );

  const enriched: ManifestWithRows[] = manifests.map((m) => ({
    manifest: m,
    rows: m.dependencies.map((d) => {
      const latest =
        d.ecosystem === "NPM" ? (npmLatestMap.get(d.packageName) ?? null) : null;
      return { dep: d, outdated: computeOutdated(d.requirements, latest) };
    }),
  }));

  const totalDeps = enriched.reduce((acc, m) => acc + m.rows.length, 0);
  const totalOutdated = enriched.reduce(
    (acc, m) => acc + m.rows.filter((r) => r.outdated.isOutdated).length,
    0,
  );

  if (manifests.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          plain
          title="Dependencies"
          description="Detected from GitHub Dependency Graph"
        />
        <EmptyState
          icon={Package}
          title="No dependency manifests detected"
          description="GitHub didn't surface any parseable manifests for this repo. Make sure Dependency Graph is enabled (Settings → Code security)."
        />
      </div>
    );
  }

  const outdatedRows = enriched.flatMap((m) =>
    m.rows
      .filter(
        (r): r is DependencyRow & { outdated: Extract<OutdatedResult, { isOutdated: true }> } =>
          r.outdated.isOutdated,
      )
      .map((r) => ({
        manifestPath: m.manifest.path,
        packageName: r.dep.packageName,
        current: r.outdated.current,
        latest: r.outdated.latest,
        severity: r.outdated.severity,
        ecosystem: r.dep.ecosystem,
      })),
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        plain
        title="Dependencies"
        description={`${totalDeps} declared · ${totalOutdated} outdated · ${manifests.length} manifest${manifests.length === 1 ? "" : "s"}`}
        action={
          totalOutdated > 0 ? (
            <CreateOutdatedIssueDialog
              owner={owner}
              repo={repo}
              outdated={outdatedRows}
            />
          ) : undefined
        }
      />

      <FilterTabs owner={owner} repo={repo} active={filter} />

      <div className="flex flex-col gap-4">
        {enriched.map(({ manifest, rows }) => (
          <ManifestCard
            key={manifest.id}
            manifest={manifest}
            rows={rows}
            filter={filter}
          />
        ))}
      </div>
    </div>
  );
}

function FilterTabs({
  owner,
  repo,
  active,
}: {
  owner: string;
  repo: string;
  active: "all" | "outdated";
}) {
  const base = `/repositories/${owner}/${repo}/dependencies`;
  const items: Array<{ k: "all" | "outdated"; label: string }> = [
    { k: "all", label: "All" },
    { k: "outdated", label: "Outdated only" },
  ];
  return (
    <div className="flex items-center gap-2">
      {items.map((it) => {
        const href = it.k === "all" ? base : `${base}?filter=outdated`;
        const isActive = active === it.k;
        return (
          <a
            key={it.k}
            href={href}
            className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {it.label}
          </a>
        );
      })}
    </div>
  );
}
