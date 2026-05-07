"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");
  return session.user.id;
}

const ownerSchema = z.string().min(1).max(100).regex(/^[A-Za-z0-9._-]+$/);
const repoSchema = z.string().min(1).max(100).regex(/^[A-Za-z0-9._-]+$/);
const numberSchema = z.coerce.number().int().positive();
const bodySchema = z.string().min(1).max(65535);

const createIssueSchema = z.object({
  title: z.string().min(1).max(256),
  body: z.string().max(65535).optional(),
  labels: z.string().max(1000).optional(),
});

// ─── Comment ─────────────────────────────────────────────────────────────────

export async function commentIssueAction(formData: FormData) {
  const userId = await requireUserId();
  const owner = ownerSchema.parse(formData.get("owner"));
  const repo = repoSchema.parse(formData.get("repo"));
  const number = numberSchema.parse(formData.get("number"));
  const body = bodySchema.parse(formData.get("body"));

  await githubService.createIssueComment(userId, owner, repo, number, body);
  revalidatePath(`/repositories/${owner}/${repo}/issues/${number}`);
}

// ─── State ───────────────────────────────────────────────────────────────────

export async function closeIssueAction(formData: FormData) {
  const userId = await requireUserId();
  const owner = ownerSchema.parse(formData.get("owner"));
  const repo = repoSchema.parse(formData.get("repo"));
  const number = numberSchema.parse(formData.get("number"));

  await githubService.updateIssueState(userId, owner, repo, number, "closed");
  revalidatePath(`/repositories/${owner}/${repo}/issues/${number}`);
  revalidatePath(`/repositories/${owner}/${repo}/issues`);
}

export async function reopenIssueAction(formData: FormData) {
  const userId = await requireUserId();
  const owner = ownerSchema.parse(formData.get("owner"));
  const repo = repoSchema.parse(formData.get("repo"));
  const number = numberSchema.parse(formData.get("number"));

  await githubService.updateIssueState(userId, owner, repo, number, "open");
  revalidatePath(`/repositories/${owner}/${repo}/issues/${number}`);
  revalidatePath(`/repositories/${owner}/${repo}/issues`);
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createIssueAction(formData: FormData) {
  const userId = await requireUserId();
  const owner = ownerSchema.parse(formData.get("owner"));
  const repo = repoSchema.parse(formData.get("repo"));

  const parsed = createIssueSchema.parse({
    title: formData.get("title"),
    body: formData.get("body") || undefined,
    labels: formData.get("labels") || undefined,
  });

  const labels = parsed.labels
    ? parsed.labels
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean)
    : undefined;

  const issue = await githubService.createIssue(userId, owner, repo, {
    title: parsed.title,
    body: parsed.body,
    labels,
  });

  redirect(`/repositories/${owner}/${repo}/issues/${issue.number}`);
}
