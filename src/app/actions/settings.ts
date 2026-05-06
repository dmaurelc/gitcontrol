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

const themeSchema = z.enum(["light", "dark", "system"]);

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");
  return session.user.id;
}

export async function updateThemeAction(theme: string) {
  const userId = await requireUserId();
  const parsed = themeSchema.parse(theme);
  await db
    .update(userPreferences)
    .set({ theme: parsed, updatedAt: new Date() })
    .where(eq(userPreferences.userId, userId));
  revalidatePath("/", "layout");
}

export async function pinRepoAction(fullName: string) {
  const userId = await requireUserId();
  await db
    .update(userPreferences)
    .set({
      pinnedRepos: sql`COALESCE(${userPreferences.pinnedRepos}, '[]'::jsonb) || ${JSON.stringify([fullName])}::jsonb`,
      updatedAt: new Date(),
    })
    .where(eq(userPreferences.userId, userId));
  revalidatePath("/settings");
  revalidatePath("/repositories");
}

export async function unpinRepoAction(fullName: string) {
  const userId = await requireUserId();
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
}

export async function revokeAccessAction() {
  const userId = await requireUserId();
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
