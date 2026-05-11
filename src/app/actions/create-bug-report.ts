"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { UPSTREAM_OWNER, UPSTREAM_REPO } from "@/lib/github/upstream";
import { enforceRateLimit } from "@/lib/rate-limit/check-rate-limit";

const schema = z.object({
  title: z.string().trim().min(5).max(256),
  description: z.string().trim().min(20).max(40000),
  type: z.enum(["bug", "enhancement", "question"]),
  steps: z.string().trim().max(10000).optional().or(z.literal("")),
  expected: z.string().trim().max(5000).optional().or(z.literal("")),
  actual: z.string().trim().max(5000).optional().or(z.literal("")),
});

function buildBody(input: z.infer<typeof schema>): string {
  const sections: string[] = [`## Description\n\n${input.description}`];

  // Optional sections are skipped entirely when empty so the issue body
  // stays concise and doesn't show placeholder "_Not provided_" lines.
  const steps = input.steps?.trim();
  if (steps) sections.push(`## Steps to reproduce\n\n${steps}`);

  const expected = input.expected?.trim();
  if (expected) sections.push(`## Expected behavior\n\n${expected}`);

  const actual = input.actual?.trim();
  if (actual) sections.push(`## Actual behavior\n\n${actual}`);

  sections.push(`---\n_Reported via GitControl bug report form._`);
  return sections.join("\n\n");
}

export type BugReportActionResult =
  | { status: "ok" }
  | { status: "error"; message: string };

/**
 * Creates an issue in the upstream gitcontrol repo using the logged-in user's
 * GitHub OAuth token. Redirects to the new issue on success; returns a
 * structured error on failure so the client form can render it.
 */
export async function createBugReportAction(
  _prev: BugReportActionResult | null,
  formData: FormData,
): Promise<BugReportActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { status: "error", message: "Not authenticated. Sign in again." };

  try {
    await enforceRateLimit({
      bucket: "bug-report",
      identifier: session.user.id,
      max: 3,
      windowSeconds: 300,
    });
  } catch (err) {
    return { status: "error", message: (err as Error).message };
  }

  const parsed = schema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    type: formData.get("type"),
    steps: formData.get("steps") ?? "",
    expected: formData.get("expected") ?? "",
    actual: formData.get("actual") ?? "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues.map((i) => `${i.path.join(".") || "field"}: ${i.message}`).join("; "),
    };
  }

  const body = buildBody(parsed.data);

  try {
    const issue = await githubService.createIssue(
      session.user.id,
      UPSTREAM_OWNER,
      UPSTREAM_REPO,
      {
        title: parsed.data.title,
        body,
        labels: [parsed.data.type],
      },
    );
    redirect(`/repositories/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/issues/${issue.number}`);
  } catch (err) {
    const e = err as { digest?: string; status?: number; message?: string };
    if (e?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    if (e.status === 401)
      return { status: "error", message: "GitHub auth expired. Sign in again." };
    if (e.status === 403)
      return {
        status: "error",
        message: "GitHub denied the request. Token may be missing the `repo` scope — sign out and back in.",
      };
    if (e.status === 404)
      return {
        status: "error",
        message: "No access to the gitcontrol repo. Contact the maintainer to be added as a collaborator.",
      };
    return { status: "error", message: e.message ?? "Failed to create issue. Try again." };
  }
}
