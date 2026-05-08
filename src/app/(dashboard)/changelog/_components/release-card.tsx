import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MarkdownBody } from "@/components/markdown-body";
import type { RepoRelease } from "@/lib/github/service";

export type ReleaseCardItem = {
  release: RepoRelease;
  /**
   * ISO date of the tagged commit. Preferred over `published_at` because
   * GitHub does not allow editing `published_at` after creation, so it
   * always reflects the moment the Release row was created — not when
   * the code shipped.
   */
  commitDate: string | null;
};

type Props = {
  item: ReleaseCardItem;
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ReleaseCard({ item }: Props) {
  const { release, commitDate } = item;
  const title = release.name?.trim() || release.tag_name;
  const displayDate = commitDate ?? release.published_at ?? release.created_at;
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold leading-tight">{title}</h2>
            <Badge variant="outline" className="font-mono text-[11px]">
              {release.tag_name}
            </Badge>
            {release.prerelease ? (
              <Badge variant="secondary" className="text-[11px]">
                Pre-release
              </Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <time dateTime={displayDate} title={displayDate}>
              {formatDate(displayDate)}
            </time>
            <a
              href={release.html_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              GitHub <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {release.body?.trim() ? (
          <MarkdownBody>{release.body}</MarkdownBody>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            No release notes provided.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
