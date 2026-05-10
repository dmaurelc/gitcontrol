"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { githubService, type RepoDirEntry } from "@/lib/github/service";
import { runAction, type ActionResult } from "@/lib/actions/result";
import { enforceRateLimit } from "@/lib/rate-limit/check-rate-limit";

const ownerSchema = z.string().min(1).max(100).regex(/^[A-Za-z0-9._-]+$/);
const repoSchema = z.string().min(1).max(100).regex(/^[A-Za-z0-9._-]+$/);
const pathSchema = z.string().max(2048).optional();
const refSchema = z
  .string()
  .max(255)
  .regex(/^[A-Za-z0-9._\-/]+$/)
  .optional();

export type ListDirInput = {
  owner: string;
  repo: string;
  path?: string;
  ref?: string;
};

export async function listRepoDirAction(
  input: ListDirInput,
): Promise<ActionResult<RepoDirEntry[]>> {
  return runAction(async () => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Not authenticated");
    const userId = session.user.id;

    await enforceRateLimit({
      bucket: "gh:read",
      identifier: userId,
      max: 60,
      windowSeconds: 60,
    });

    const owner = ownerSchema.parse(input.owner);
    const repo = repoSchema.parse(input.repo);
    const path = (pathSchema.parse(input.path) ?? "").replace(/^\/+|\/+$/g, "");
    const ref = refSchema.parse(input.ref);

    const res = await githubService.getContent(userId, owner, repo, path, ref);
    if (res.data.kind !== "dir") {
      throw new Error("Path is not a directory.");
    }
    return res.data.entries;
  });
}
