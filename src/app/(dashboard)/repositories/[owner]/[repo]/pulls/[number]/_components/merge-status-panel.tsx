import {
  CheckCircle2,
  CircleDashed,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type {
  CheckRunSummary,
  PullRequestReview,
} from "@/lib/github/service";

type Props = {
  mergeable: boolean | null | undefined;
  mergeableState: string | undefined;
  checks: CheckRunSummary[];
  reviews: PullRequestReview[];
};

type CheckTally = {
  passing: number;
  failing: number;
  pending: number;
  skipped: number;
};

function tallyChecks(checks: CheckRunSummary[]): CheckTally {
  const t: CheckTally = { passing: 0, failing: 0, pending: 0, skipped: 0 };
  for (const c of checks) {
    if (c.status !== "completed") {
      t.pending++;
      continue;
    }
    switch (c.conclusion) {
      case "success":
        t.passing++;
        break;
      case "skipped":
      case "neutral":
        t.skipped++;
        break;
      case null:
        t.pending++;
        break;
      default:
        t.failing++;
    }
  }
  return t;
}

/**
 * Last review per author wins, ignoring COMMENTED/PENDING/DISMISSED unless
 * they're the latest. Mirrors GitHub's "Reviews" gate logic.
 */
function latestReviewByAuthor(
  reviews: PullRequestReview[],
): PullRequestReview[] {
  const map = new Map<string, PullRequestReview>();
  for (const r of reviews) {
    const login = r.user?.login;
    if (!login) continue;
    if (r.state === "PENDING") continue;
    map.set(login, r);
  }
  return [...map.values()];
}

export function MergeStatusPanel({
  mergeable,
  mergeableState,
  checks,
  reviews,
}: Props) {
  const tally = tallyChecks(checks);
  const latest = latestReviewByAuthor(reviews);
  const approved = latest.filter((r) => r.state === "APPROVED");
  const requestedChanges = latest.filter((r) => r.state === "CHANGES_REQUESTED");

  const mergeableLabel =
    mergeable === null || mergeable === undefined
      ? "Calculando…"
      : mergeable
        ? "Sin conflictos"
        : "Conflictos detectados";

  const stateNote =
    mergeableState === "blocked"
      ? "Bloqueado por reglas de protección de rama."
      : mergeableState === "behind"
        ? "La rama está por detrás de la base."
        : mergeableState === "dirty"
          ? "La rama tiene conflictos con la base."
          : mergeableState === "draft"
            ? "PR en estado draft."
            : null;

  return (
    <div className="rounded-md border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        {mergeable ? (
          <CheckCircle2 className="size-5 text-emerald-500" />
        ) : mergeable === false ? (
          <XCircle className="size-5 text-red-500" />
        ) : (
          <CircleDashed className="size-5 text-muted-foreground" />
        )}
        <span className="text-sm font-medium">{mergeableLabel}</span>
        {stateNote ? (
          <span className="text-xs text-muted-foreground">{stateNote}</span>
        ) : null}
      </div>

      <div className="grid gap-3 px-4 py-3 sm:grid-cols-2">
        {/* Checks */}
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold text-muted-foreground">
            Checks
          </h4>
          {checks.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No hay checks configurados.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                {tally.passing > 0 && (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 text-emerald-600"
                  >
                    {tally.passing} passing
                  </Badge>
                )}
                {tally.failing > 0 && (
                  <Badge variant="destructive">{tally.failing} failing</Badge>
                )}
                {tally.pending > 0 && (
                  <Badge variant="outline">{tally.pending} pending</Badge>
                )}
                {tally.skipped > 0 && (
                  <Badge variant="secondary">{tally.skipped} skipped</Badge>
                )}
              </div>
              <ul className="flex flex-col gap-1">
                {checks.slice(0, 5).map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-2 text-xs"
                  >
                    {c.status !== "completed" ? (
                      <CircleDashed className="size-3 shrink-0 text-muted-foreground" />
                    ) : c.conclusion === "success" ? (
                      <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />
                    ) : c.conclusion === "skipped" ||
                      c.conclusion === "neutral" ? (
                      <CircleDashed className="size-3 shrink-0 text-muted-foreground" />
                    ) : (
                      <XCircle className="size-3 shrink-0 text-red-500" />
                    )}
                    <span className="truncate">{c.name}</span>
                    {c.html_url ? (
                      <a
                        href={c.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="size-3" />
                      </a>
                    ) : null}
                  </li>
                ))}
                {checks.length > 5 && (
                  <li className="text-xs text-muted-foreground">
                    +{checks.length - 5} más…
                  </li>
                )}
              </ul>
            </>
          )}
        </div>

        {/* Reviews */}
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold text-muted-foreground">
            Reviews
          </h4>
          {latest.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Sin reviews aún.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                {approved.length > 0 && (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 text-emerald-600"
                  >
                    {approved.length} approved
                  </Badge>
                )}
                {requestedChanges.length > 0 && (
                  <Badge variant="destructive">
                    {requestedChanges.length} changes requested
                  </Badge>
                )}
              </div>
              <ul className="flex flex-col gap-1">
                {latest.slice(0, 5).map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-2 text-xs"
                  >
                    {r.state === "APPROVED" ? (
                      <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />
                    ) : r.state === "CHANGES_REQUESTED" ? (
                      <AlertTriangle className="size-3 shrink-0 text-amber-500" />
                    ) : (
                      <CircleDashed className="size-3 shrink-0 text-muted-foreground" />
                    )}
                    {r.user ? (
                      <Avatar className="size-4">
                        <AvatarImage src={r.user.avatar_url} />
                        <AvatarFallback>
                          {r.user.login[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : null}
                    <span className="truncate">
                      {r.user?.login ?? "anónimo"}
                    </span>
                    <span className="text-muted-foreground">{r.state}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
