import "server-only";
import { getGithubClients } from "./client";
import { cachedFetch, TTL } from "./cache";

export type DependencyEcosystem =
  | "NPM"
  | "PIP"
  | "GO"
  | "MAVEN"
  | "RUBYGEMS"
  | "COMPOSER"
  | "NUGET"
  | "RUST"
  | "ACTIONS"
  | "GITSUBMODULE"
  | "OTHER";

export type RepoDependency = {
  packageName: string;
  /** Raw requirement spec, e.g. ">= 1.2.0", "^1.0.0", "= 1.4.3". */
  requirements: string;
  ecosystem: DependencyEcosystem;
  /** GitHub-recognized package URL, when known (links to repo for OSS). */
  packageUrl: string | null;
};

export type RepoManifest = {
  id: string;
  filename: string;
  /** Path within the repo, e.g. "package.json", "apps/web/package.json". */
  path: string;
  dependencyCount: number;
  dependencies: RepoDependency[];
};

type ManifestNode = {
  id: string;
  filename: string;
  parseable: boolean;
  blobPath: string | null;
  dependenciesCount: number;
  dependencies: {
    nodes: Array<{
      packageName: string | null;
      requirements: string | null;
      packageManager: string | null;
    }>;
  };
};

type DependencyGraphResponse = {
  repository: {
    dependencyGraphManifests: {
      nodes: ManifestNode[];
    } | null;
  } | null;
};

/**
 * Maps GitHub's `packageManager` enum (per-dependency) to our normalized
 * ecosystem id. Unknown values fall through to "OTHER".
 */
function ecosystemFromPackageManager(pm: string | null): DependencyEcosystem {
  switch (pm) {
    case "NPM":
    case "PIP":
    case "GO":
    case "MAVEN":
    case "RUBYGEMS":
    case "COMPOSER":
    case "NUGET":
    case "RUST":
    case "ACTIONS":
    case "GITSUBMODULE":
      return pm;
    default:
      return "OTHER";
  }
}

/**
 * Fetches the GitHub Dependency Graph manifests for a repo via GraphQL.
 * Requires Dependency Graph to be enabled (default for public repos,
 * opt-in for private). Cached for `TTL.dependencyManifests`.
 */
export async function getDependencyManifests(
  userId: string,
  owner: string,
  repo: string,
): Promise<RepoManifest[]> {
  const { gql } = await getGithubClients(userId);
  const params = { owner, repo };
  const result = await cachedFetch<RepoManifest[]>({
    userId,
    resource: "dependencyManifests",
    params,
    ttlSeconds: TTL.dependencyManifests,
    fetcher: async () => {
      // hawkgirl-preview previously gated dependencyGraphManifests; it
      // is GA on github.com but harmless on requests that don't need it.
      const gqlWithPreview = gql.defaults({
        headers: { accept: "application/vnd.github.hawkgirl-preview+json" },
      });

      // GitHub's dependency graph endpoint is occasionally flaky on large
      // queries — retry once after a short backoff before giving up.
      let data: DependencyGraphResponse | null = null;
      let lastErr: unknown = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          data = await gqlWithPreview<DependencyGraphResponse>(
            `
              query($owner: String!, $repo: String!) {
                repository(owner: $owner, name: $repo) {
                  dependencyGraphManifests(first: 10) {
                    nodes {
                      id
                      filename
                      parseable
                      blobPath
                      dependenciesCount
                      dependencies(first: 100) {
                        nodes {
                          packageName
                          requirements
                          packageManager
                        }
                      }
                    }
                  }
                }
              }
            `,
            { owner, repo },
          );
          break;
        } catch (err) {
          lastErr = err;
          if (attempt === 0) await new Promise((r) => setTimeout(r, 500));
        }
      }
      if (!data) {
        console.error(
          `[dependencies] GraphQL fetch failed for ${owner}/${repo}:`,
          lastErr instanceof Error ? lastErr.message : lastErr,
        );
        return { notModified: false as const, body: [] };
      }
      try {
        const nodes = data.repository?.dependencyGraphManifests?.nodes ?? [];
        const manifests: RepoManifest[] = nodes
          .filter((n) => n.parseable)
          .map((n) => ({
            id: n.id,
            filename: n.filename,
            path: n.blobPath ?? n.filename,
            dependencyCount: n.dependenciesCount,
            dependencies: n.dependencies.nodes
              .filter((d) => d.packageName)
              .map((d) => ({
                packageName: d.packageName as string,
                requirements: d.requirements ?? "",
                ecosystem: ecosystemFromPackageManager(d.packageManager),
                packageUrl: null,
              })),
          }));
        return { notModified: false as const, body: manifests };
      } catch (err) {
        console.error(
          `[dependencies] parse failed for ${owner}/${repo}:`,
          err instanceof Error ? err.message : err,
        );
        return { notModified: false as const, body: [] };
      }
    },
  });
  return result.data;
}
