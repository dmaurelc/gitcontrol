"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { runAction, type ActionResult } from "@/lib/actions/result";

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");
  return session.user.id;
}

const ownerSchema = z.string().min(1).max(100).regex(/^[A-Za-z0-9._-]+$/);
const repoSchema = z.string().min(1).max(100).regex(/^[A-Za-z0-9._-]+$/);
const runIdSchema = z.coerce.number().int().positive();

export async function reRunWorkflowAction(
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const userId = await requireUserId();
    const owner = ownerSchema.parse(formData.get("owner"));
    const repo = repoSchema.parse(formData.get("repo"));
    const runId = runIdSchema.parse(formData.get("run_id"));

    await githubService.reRunWorkflow(userId, owner, repo, runId);

    revalidatePath(`/repositories/${owner}/${repo}/actions`);
    revalidatePath(`/repositories/${owner}/${repo}/actions/${runId}`);
  });
}
