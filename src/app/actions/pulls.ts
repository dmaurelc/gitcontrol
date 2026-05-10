"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { runAction, type ActionResult } from "@/lib/actions/result";
import { enforceRateLimit } from "@/lib/rate-limit/check-rate-limit";

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");
  return session.user.id;
}

const ownerSchema = z.string().min(1).max(100).regex(/^[A-Za-z0-9._-]+$/);
const repoSchema = z.string().min(1).max(100).regex(/^[A-Za-z0-9._-]+$/);
const numberSchema = z.coerce.number().int().positive();
const bodySchema = z.string().min(1).max(65535);

// ─── Comment ─────────────────────────────────────────────────────────────────

export async function commentPullRequestAction(
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const userId = await requireUserId();
    await enforceRateLimit({
      bucket: "gh:write",
      identifier: userId,
      max: 10,
      windowSeconds: 60,
    });
    const owner = ownerSchema.parse(formData.get("owner"));
    const repo = repoSchema.parse(formData.get("repo"));
    const number = numberSchema.parse(formData.get("number"));
    const body = bodySchema.parse(formData.get("body"));

    await githubService.createIssueComment(userId, owner, repo, number, body);
    revalidatePath(`/repositories/${owner}/${repo}/pulls/${number}`);
  });
}

// ─── State ───────────────────────────────────────────────────────────────────

export async function closePullRequestAction(
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const userId = await requireUserId();
    await enforceRateLimit({
      bucket: "gh:write",
      identifier: userId,
      max: 10,
      windowSeconds: 60,
    });
    const owner = ownerSchema.parse(formData.get("owner"));
    const repo = repoSchema.parse(formData.get("repo"));
    const number = numberSchema.parse(formData.get("number"));

    await githubService.updatePullRequestState(userId, owner, repo, number, "closed");
    revalidatePath(`/repositories/${owner}/${repo}/pulls/${number}`);
    revalidatePath(`/repositories/${owner}/${repo}/pulls`);
  });
}

export async function reopenPullRequestAction(
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const userId = await requireUserId();
    await enforceRateLimit({
      bucket: "gh:write",
      identifier: userId,
      max: 10,
      windowSeconds: 60,
    });
    const owner = ownerSchema.parse(formData.get("owner"));
    const repo = repoSchema.parse(formData.get("repo"));
    const number = numberSchema.parse(formData.get("number"));

    await githubService.updatePullRequestState(userId, owner, repo, number, "open");
    revalidatePath(`/repositories/${owner}/${repo}/pulls/${number}`);
    revalidatePath(`/repositories/${owner}/${repo}/pulls`);
  });
}
