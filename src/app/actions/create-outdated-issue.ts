"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { enforceRateLimit } from "@/lib/rate-limit/check-rate-limit";

const ownerSchema = z.string().min(1).max(100).regex(/^[A-Za-z0-9._-]+$/);
const repoSchema = z.string().min(1).max(100).regex(/^[A-Za-z0-9._-]+$/);
const titleSchema = z.string().min(1).max(256);
const bodySchema = z.string().min(1).max(65535);
const labelsSchema = z.string().max(1000).optional();

/**
 * Creates a GitHub issue from a pre-rendered markdown body listing
 * outdated dependencies. Redirects to the new issue on success.
 */
export async function createOutdatedIssueAction(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");
  const userId = session.user.id;
  await enforceRateLimit({
    bucket: "gh:write",
    identifier: userId,
    max: 10,
    windowSeconds: 60,
  });

  const owner = ownerSchema.parse(formData.get("owner"));
  const repo = repoSchema.parse(formData.get("repo"));
  const title = titleSchema.parse(formData.get("title"));
  const body = bodySchema.parse(formData.get("body"));
  const labelsRaw = labelsSchema.parse(formData.get("labels") || undefined);

  const labels = labelsRaw
    ? labelsRaw
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean)
    : ["dependencies"];

  const issue = await githubService.createIssue(userId, owner, repo, {
    title,
    body,
    labels,
  });

  redirect(`/repositories/${owner}/${repo}/issues/${issue.number}`);
}
