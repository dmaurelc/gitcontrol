"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { runAction, type ActionResult } from "@/lib/actions/result";
import { enforceRateLimit } from "@/lib/rate-limit/check-rate-limit";
import { githubServiceWrite } from "@/lib/github/service-write";
import { githubService } from "@/lib/github/service";

// Shared validation primitives. GitHub limits: branch name ≤ 244 chars, no
// leading slash / no double dots / etc.
const BRANCH_NAME_REGEX = /^(?!\/)(?!.*\/$)(?!.*\.\.)[a-zA-Z0-9._/-]+$/;
const PATH_REGEX = /^(?!.*\.\.)[a-zA-Z0-9._/-]+$/;
const SHA_REGEX = /^[a-f0-9]{40}$/;

const WRITE_BUCKET = "gh:write";
const WRITE_MAX = 10;
const WRITE_WINDOW = 60;

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");
  return session.user.id;
}

// ─── Create branch ──────────────────────────────────────────────────────────

const createBranchSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branchName: z.string().regex(BRANCH_NAME_REGEX).max(244),
  baseSha: z.string().regex(SHA_REGEX),
});

export async function createBranchAction(
  input: z.infer<typeof createBranchSchema>,
): Promise<ActionResult<{ ref: string; sha: string }>> {
  return runAction(async () => {
    const userId = await requireUser();
    await enforceRateLimit({
      bucket: WRITE_BUCKET,
      identifier: userId,
      max: WRITE_MAX,
      windowSeconds: WRITE_WINDOW,
    });
    const parsed = createBranchSchema.parse(input);
    const data = await githubServiceWrite.createBranchRef(
      userId,
      parsed.owner,
      parsed.repo,
      parsed.branchName,
      parsed.baseSha,
    );
    revalidatePath(`/repositories/${parsed.owner}/${parsed.repo}/explorer`);
    return data;
  });
}

// ─── Edit file ──────────────────────────────────────────────────────────────

const editFileSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  path: z.string().regex(PATH_REGEX).max(255),
  message: z.string().min(1).max(72),
  content: z.string(), // length bounded by GitHub (~100MB but practical edit ≤ a few MB)
  branch: z.string().regex(BRANCH_NAME_REGEX).max(244),
  sha: z.string().regex(/^[a-f0-9]{40}$/).optional(),
  // If set, server creates this branch off `baseSha` before committing.
  createBranch: z
    .object({
      newBranchName: z.string().regex(BRANCH_NAME_REGEX).max(244),
      baseSha: z.string().regex(SHA_REGEX),
    })
    .optional(),
});

export async function editFileAction(
  input: z.infer<typeof editFileSchema>,
): Promise<ActionResult<{ commitSha: string; branch: string }>> {
  return runAction(async () => {
    const userId = await requireUser();
    await enforceRateLimit({
      bucket: WRITE_BUCKET,
      identifier: userId,
      max: WRITE_MAX,
      windowSeconds: WRITE_WINDOW,
    });
    const parsed = editFileSchema.parse(input);

    let targetBranch = parsed.branch;
    if (parsed.createBranch) {
      await githubServiceWrite.createBranchRef(
        userId,
        parsed.owner,
        parsed.repo,
        parsed.createBranch.newBranchName,
        parsed.createBranch.baseSha,
      );
      targetBranch = parsed.createBranch.newBranchName;
    }

    const res = await githubServiceWrite.createOrUpdateFile(
      userId,
      parsed.owner,
      parsed.repo,
      {
        path: parsed.path,
        message: parsed.message,
        content: parsed.content,
        branch: targetBranch,
        sha: parsed.sha,
      },
    );
    revalidatePath(`/repositories/${parsed.owner}/${parsed.repo}/explorer`);
    return { commitSha: res.commitSha, branch: targetBranch };
  });
}

// ─── Create PR ──────────────────────────────────────────────────────────────

const createPrSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  title: z.string().min(1).max(256),
  head: z.string().regex(BRANCH_NAME_REGEX).max(244),
  base: z.string().regex(BRANCH_NAME_REGEX).max(244),
  body: z.string().max(65535).optional(),
  draft: z.boolean().optional(),
});

export async function createPrAction(
  input: z.infer<typeof createPrSchema>,
): Promise<ActionResult<{ number: number; html_url: string }>> {
  return runAction(async () => {
    const userId = await requireUser();
    await enforceRateLimit({
      bucket: WRITE_BUCKET,
      identifier: userId,
      max: WRITE_MAX,
      windowSeconds: WRITE_WINDOW,
    });
    const parsed = createPrSchema.parse(input);
    const data = await githubServiceWrite.createPullRequest(
      userId,
      parsed.owner,
      parsed.repo,
      {
        title: parsed.title,
        head: parsed.head,
        base: parsed.base,
        body: parsed.body,
        draft: parsed.draft,
      },
    );
    revalidatePath(`/repositories/${parsed.owner}/${parsed.repo}/explorer`);
    revalidatePath(`/repositories/${parsed.owner}/${parsed.repo}/pulls`);
    return data;
  });
}

// ─── Helper: read file content (raw text) ──────────────────────────────────

const readFileSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  path: z.string().regex(PATH_REGEX).max(255),
  ref: z.string().min(1),
});

export async function readFileForEditAction(
  input: z.infer<typeof readFileSchema>,
): Promise<ActionResult<{ content: string; sha: string }>> {
  return runAction(async () => {
    const userId = await requireUser();
    const parsed = readFileSchema.parse(input);
    const res = await githubService.getContent(
      userId,
      parsed.owner,
      parsed.repo,
      parsed.path,
      parsed.ref,
    );
    const result = res.data;
    if (result.kind !== "file") {
      throw new Error("Path is not a file.");
    }
    const file = result.file;
    const content =
      file.encoding === "base64"
        ? Buffer.from(file.content, "base64").toString("utf-8")
        : file.content;
    return { content, sha: file.sha };
  });
}
