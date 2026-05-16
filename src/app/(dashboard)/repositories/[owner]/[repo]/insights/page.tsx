import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Lock, AlertTriangle } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { GithubError } from "@/lib/github/errors";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CommitActivityChart } from "./_components/commit-activity-chart";
import { CodeFrequencyChart } from "./_components/code-frequency-chart";
import { TrafficChart } from "./_components/traffic-chart";

type SectionError = "forbidden" | "not_found" | "error" | null;

function classifyError(err: unknown): SectionError {
  if (err instanceof GithubError) {
    if (err.status === 403) return "forbidden";
    if (err.status === 404) return "not_found";
    return "error";
  }
  return "error";
}

export default async function RepoInsightsPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");
  const { owner, repo } = await params;
  const userId = session.user.id;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Suspense fallback={<ChartSkeleton title="Commit activity" />}>
        <CommitActivitySection userId={userId} owner={owner} repo={repo} />
      </Suspense>
      <Suspense fallback={<ChartSkeleton title="Code frequency" />}>
        <CodeFrequencySection userId={userId} owner={owner} repo={repo} />
      </Suspense>
      <div className="lg:col-span-2">
        <Suspense fallback={<ChartSkeleton title="Traffic (14 days)" />}>
          <TrafficSection userId={userId} owner={owner} repo={repo} />
        </Suspense>
      </div>
    </div>
  );
}

async function CommitActivitySection({
  userId,
  owner,
  repo,
}: {
  userId: string;
  owner: string;
  repo: string;
}) {
  let data: Awaited<ReturnType<typeof githubService.getCommitActivity>>["data"] = null;
  let err: SectionError = null;
  try {
    const res = await githubService.getCommitActivity(userId, owner, repo);
    data = res.data;
  } catch (e) {
    err = classifyError(e);
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Commit activity</CardTitle>
        <CardDescription>Weekly commits — last 52 weeks</CardDescription>
      </CardHeader>
      <CardContent>
        {err ? (
          <SectionErrorPlaceholder kind={err} />
        ) : data === null ? (
          <ComputingPlaceholder />
        ) : (
          <CommitActivityChart data={data} />
        )}
      </CardContent>
    </Card>
  );
}

async function CodeFrequencySection({
  userId,
  owner,
  repo,
}: {
  userId: string;
  owner: string;
  repo: string;
}) {
  let data: Awaited<ReturnType<typeof githubService.getCodeFrequency>>["data"] = null;
  let err: SectionError = null;
  try {
    const res = await githubService.getCodeFrequency(userId, owner, repo);
    data = res.data;
  } catch (e) {
    err = classifyError(e);
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Code frequency</CardTitle>
        <CardDescription>Additions vs deletions per week</CardDescription>
      </CardHeader>
      <CardContent>
        {err ? (
          <SectionErrorPlaceholder kind={err} />
        ) : data === null ? (
          <ComputingPlaceholder />
        ) : (
          <CodeFrequencyChart data={data} />
        )}
      </CardContent>
    </Card>
  );
}

async function TrafficSection({
  userId,
  owner,
  repo,
}: {
  userId: string;
  owner: string;
  repo: string;
}) {
  let traffic: Awaited<ReturnType<typeof githubService.getRepoTraffic>>["data"] | null = null;
  try {
    const res = await githubService.getRepoTraffic(userId, owner, repo);
    traffic = res.data;
  } catch {
    // getRepoTraffic ya degrada a restricted via Promise.allSettled; otros
    // errores los tratamos como restricted también para mantener UI estable.
  }

  const totalViews = traffic?.views?.count ?? 0;
  const uniqueViewers = traffic?.views?.uniques ?? 0;
  const totalClones = traffic?.clones?.count ?? 0;
  const uniqueCloners = traffic?.clones?.uniques ?? 0;

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Traffic</CardTitle>
            <CardDescription>Views and clones — last 14 days</CardDescription>
          </div>
          {traffic && !traffic.restricted ? (
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground tabular-nums">
              <span>
                <strong className="text-foreground">{totalViews.toLocaleString()}</strong>{" "}
                views ({uniqueViewers} unique)
              </span>
              <span>
                <strong className="text-foreground">{totalClones.toLocaleString()}</strong>{" "}
                clones ({uniqueCloners} unique)
              </span>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {!traffic || traffic.restricted ? (
          <RestrictedPlaceholder />
        ) : (
          <TrafficChart views={traffic.views} clones={traffic.clones} />
        )}
      </CardContent>
    </Card>
  );
}

function ComputingPlaceholder() {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
      GitHub está calculando las estadísticas. Recarga en unos segundos.
    </div>
  );
}

function RestrictedPlaceholder() {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-1 text-center">
      <Lock className="size-5 text-muted-foreground" />
      <p className="text-sm font-medium">Estadísticas de tráfico restringidas</p>
      <p className="text-xs text-muted-foreground">
        Requiere permiso de escritura (push) en este repositorio.
      </p>
    </div>
  );
}

function SectionErrorPlaceholder({
  kind,
}: {
  kind: "forbidden" | "not_found" | "error";
}) {
  if (kind === "forbidden") {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-1 text-center">
        <Lock className="size-5 text-muted-foreground" />
        <p className="text-sm font-medium">Sin permisos</p>
        <p className="text-xs text-muted-foreground">
          No tienes acceso a estas estadísticas en este repositorio.
        </p>
      </div>
    );
  }
  if (kind === "not_found") {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-1 text-center">
        <AlertTriangle className="size-5 text-muted-foreground" />
        <p className="text-sm font-medium">Datos no disponibles</p>
        <p className="text-xs text-muted-foreground">
          GitHub no expone estas estadísticas para este repositorio.
        </p>
      </div>
    );
  }
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-1 text-center">
      <AlertTriangle className="size-5 text-muted-foreground" />
      <p className="text-sm font-medium">No se pudieron cargar los datos</p>
      <p className="text-xs text-muted-foreground">
        Intenta nuevamente en unos segundos.
      </p>
    </div>
  );
}

function ChartSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-48 w-full rounded" />
      </CardContent>
    </Card>
  );
}
