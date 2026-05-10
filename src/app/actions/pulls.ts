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
const mergeMethodSchema = z.enum(["merge", "squash", "rebase"]);
const shaSchema = z.string().regex(/^[a-f0-9]{40}$/);
const mergeTitleSchema = z.string().trim().min(1).max(256).optional();
const mergeMessageSchema = z.string().trim().max(65535).optional();

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

// ─── Merge ────────────────────────────────────────────────────────────────────

/**
 * Merges a PR with the chosen method. The head SHA is sent so GitHub rejects
 * the merge if someone pushed to the branch since the user clicked — prevents
 * silently merging unreviewed commits.
 */
export async function mergePullRequestAction(
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const userId = await requireUserId();
    await enforceRateLimit({
      bucket: "gh:merge",
      identifier: userId,
      max: 5,
      windowSeconds: 60,
    });
    const owner = ownerSchema.parse(formData.get("owner"));
    const repo = repoSchema.parse(formData.get("repo"));
    const number = numberSchema.parse(formData.get("number"));
    const method = mergeMethodSchema.parse(formData.get("method"));
    const sha = shaSchema.parse(formData.get("sha"));
    const commitTitle = mergeTitleSchema.parse(
      formData.get("commitTitle") || undefined,
    );
    const commitMessage = mergeMessageSchema.parse(
      formData.get("commitMessage") || undefined,
    );

    await githubService.mergePullRequest(userId, owner, repo, number, {
      method,
      sha,
      commitTitle,
      commitMessage,
    });
    revalidatePath(`/repositories/${owner}/${repo}/pulls/${number}`);
    revalidatePath(`/repositories/${owner}/${repo}/pulls`);
  });
}
