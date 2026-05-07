import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createIssueAction } from "@/app/actions/issues";
import { NewIssueForm } from "./_components/new-issue-form";

export default async function NewIssuePage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { owner, repo } = await params;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader
        plain
        title="New issue"
        description={`${owner}/${repo}`}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={`/repositories/${owner}/${repo}/issues`}>Cancel</Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <NewIssueForm action={createIssueAction} owner={owner} repo={repo} />
        </CardContent>
      </Card>
    </div>
  );
}
