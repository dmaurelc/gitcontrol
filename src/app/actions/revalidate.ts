"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { runAction, type ActionResult } from "@/lib/actions/result";

const ALLOWED_PREFIXES = [
  "/dashboard",
  "/repositories",
  "/stars",
  "/projects",
  "/packages",
  "/issues",
  "/pulls",
  "/notifications",
  "/activity",
  "/actions",
  "/changelog",
];

export async function revalidatePathAction(
  path: string,
): Promise<ActionResult> {
  return runAction(async () => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Not authenticated");

    // Whitelist enforcement: only allow paths inside the dashboard surface
    // so a malicious caller can't trigger arbitrary revalidations.
    const ok = ALLOWED_PREFIXES.some(
      (p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`),
    );
    if (!ok) throw new Error("Path not allowed");

    revalidatePath(path);
  });
}
