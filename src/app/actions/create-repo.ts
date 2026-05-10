"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { GithubError } from "@/lib/github/errors";
import { enforceRateLimit } from "@/lib/rate-limit/check-rate-limit";

const inputSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[A-Za-z0-9_.-]+$/, {
      message: "Only letters, numbers, dot, dash and underscore are allowed",
    }),
  description: z.string().max(350).optional().or(z.literal("")),
  isPrivate: z.boolean(),
  autoInit: z.boolean(),
});

export type CreateRepoState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; fullName: string };

export async function createRepoAction(
  _prev: CreateRepoState,
  formData: FormData,
): Promise<CreateRepoState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { status: "error", message: "Not authenticated" };

  try {
    await enforceRateLimit({
      bucket: "gh:create-repo",
      identifier: session.user.id,
      max: 5,
      windowSeconds: 60,
    });
  } catch (err) {
    return { status: "error", message: (err as Error).message };
  }

  const parsed = inputSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    isPrivate: formData.get("isPrivate") === "on",
    autoInit: formData.get("autoInit") === "on",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  try {
    const repo = await githubService.createRepo(session.user.id, {
      name: parsed.data.name,
      description: parsed.data.description || undefined,
      private: parsed.data.isPrivate,
      autoInit: parsed.data.autoInit,
    });
    redirect(`/repositories/${repo.full_name}`);
  } catch (err) {
    // Next's redirect throws an internal NEXT_REDIRECT error which we must
    // re-throw so it bubbles to the framework.
    const e = err as { digest?: string };
    if (e?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    if (err instanceof GithubError) {
      return { status: "error", message: err.message };
    }
    return { status: "error", message: (err as Error).message };
  }
  return { status: "idle" };
}
