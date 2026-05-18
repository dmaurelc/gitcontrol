"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { userPreferences, account, user } from "@/lib/db/schema";
import { invalidate } from "@/lib/github/cache";
import { runAction, type ActionResult } from "@/lib/actions/result";
import { enforceRateLimit } from "@/lib/rate-limit/check-rate-limit";

const themeSchema = z.enum(["light", "dark"]);

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");
  return session.user.id;
}

export async function updateThemeAction(
  theme: string,
): Promise<ActionResult> {
  return runAction(async () => {
    const userId = await requireUserId();
    await enforceRateLimit({
      bucket: "prefs:write",
      identifier: userId,
      max: 30,
      windowSeconds: 60,
    });
    const parsed = themeSchema.parse(theme);
    await db
      .update(userPreferences)
      .set({ theme: parsed, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId));
    revalidatePath("/", "layout");
  });
}

export async function pinRepoAction(
  fullName: string,
): Promise<ActionResult> {
  return runAction(async () => {
    const userId = await requireUserId();
    await enforceRateLimit({
      bucket: "prefs:write",
      identifier: userId,
      max: 30,
      windowSeconds: 60,
    });
    await db
      .update(userPreferences)
      .set({
        pinnedRepos: sql`COALESCE(${userPreferences.pinnedRepos}, '[]'::jsonb) || ${JSON.stringify([fullName])}::jsonb`,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId));
    revalidatePath("/settings");
    revalidatePath("/repositories");
  });
}

export async function unpinRepoAction(
  fullName: string,
): Promise<ActionResult> {
  return runAction(async () => {
    const userId = await requireUserId();
    await enforceRateLimit({
      bucket: "prefs:write",
      identifier: userId,
      max: 30,
      windowSeconds: 60,
    });
    await db
      .update(userPreferences)
      .set({
        pinnedRepos: sql`(
          SELECT COALESCE(jsonb_agg(value), '[]'::jsonb)
          FROM jsonb_array_elements_text(COALESCE(${userPreferences.pinnedRepos}, '[]'::jsonb)) value
          WHERE value <> ${fullName}
        )`,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId));
    revalidatePath("/settings");
    revalidatePath("/repositories");
  });
}

export async function revokeAccessAction() {
  const userId = await requireUserId();
  // Destructive: deletes user, sessions and prefs. Hard cap to slow accidental
  // or scripted abuse — legitimate users only ever press it once.
  await enforceRateLimit({
    bucket: "account:destructive",
    identifier: userId,
    max: 3,
    windowSeconds: 3600,
  });
  // Wipe Octokit cache entries first.
  await invalidate(userId, "*");
  // Drop the GitHub account row (cascades nothing, just removes link + token).
  await db
    .delete(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "github")));
  // Drop the user row entirely (cascade removes session, prefs, accounts).
  await db.delete(user).where(eq(user.id, userId));
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
