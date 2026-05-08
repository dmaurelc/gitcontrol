import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BugReportForm } from "./_components/bug-report-form";
import { UPSTREAM_OWNER, UPSTREAM_REPO } from "@/lib/github/upstream";

export const metadata = { title: "Report a bug — MaurelDev" };

export default async function ReportBugPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Report a bug</h1>
        <p className="text-sm text-muted-foreground">
          Submit feedback or a bug report. This creates an issue in{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {UPSTREAM_OWNER}/{UPSTREAM_REPO}
          </code>{" "}
          using your GitHub account.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New report</CardTitle>
          <CardDescription>
            Markdown is supported in the description and detail fields.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BugReportForm />
        </CardContent>
      </Card>
    </div>
  );
}
