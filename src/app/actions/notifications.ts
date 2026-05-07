"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { githubService } from "@/lib/github/service";
import { runAction, type ActionResult } from "@/lib/actions/result";

const threadIdSchema = z
  .string()
  .min(1)
  .regex(/^\d+$/, "Must be a numeric thread ID");

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");
  return session.user.id;
}

/**
 * Marks a GitHub notification thread as read.
 */
export async function markNotificationReadAction(
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const userId = await requireUserId();
    const raw = formData.get("threadId");
    const threadId = threadIdSchema.parse(typeof raw === "string" ? raw : "");
    await githubService.markNotificationRead(userId, threadId);
  });
}

/**
 * Marks all notifications as read up to current time.
 */
export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  return runAction(async () => {
    const userId = await requireUserId();
    await githubService.markAllNotificationsRead(userId);
  });
}
