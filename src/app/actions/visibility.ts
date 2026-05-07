"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { userPreferences } from "@/lib/db/schema";
import { runAction, type ActionResult } from "@/lib/actions/result";

const orgLoginSchema = z.string().min(1).max(120).regex(/^[A-Za-z0-9-_.]+$/);
const fullNameSchema = z
  .string()
  .min(3)
  .max(240)
  .regex(/^[A-Za-z0-9-_.]+\/[A-Za-z0-9-_.]+$/);

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");
  return session.user.id;
}

function revalidateVisibility() {
  revalidatePath("/repositories");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

export async function hideOrgAction(login: string): Promise<ActionResult> {
  return runAction(async () => {
    const userId = await requireUserId();
    const parsed = orgLoginSchema.parse(login);
    await db
      .update(userPreferences)
      .set({
        hiddenOrgs: sql`(
          SELECT COALESCE(jsonb_agg(DISTINCT value), '[]'::jsonb)
          FROM jsonb_array_elements_text(
            COALESCE(${userPreferences.hiddenOrgs}, '[]'::jsonb) || ${JSON.stringify([parsed])}::jsonb
          ) value
        )`,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId));
    revalidateVisibility();
  });
}

export async function unhideOrgAction(login: string): Promise<ActionResult> {
  return runAction(async () => {
    const userId = await requireUserId();
    const parsed = orgLoginSchema.parse(login);
    await db
      .update(userPreferences)
      .set({
        hiddenOrgs: sql`(
          SELECT COALESCE(jsonb_agg(value), '[]'::jsonb)
          FROM jsonb_array_elements_text(COALESCE(${userPreferences.hiddenOrgs}, '[]'::jsonb)) value
          WHERE value <> ${parsed}
        )`,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId));
    revalidateVisibility();
  });
}

export async function hideRepoAction(fullName: string): Promise<ActionResult> {
  return runAction(async () => {
    const userId = await requireUserId();
    const parsed = fullNameSchema.parse(fullName);
    await db
      .update(userPreferences)
      .set({
        hiddenRepos: sql`(
          SELECT COALESCE(jsonb_agg(DISTINCT value), '[]'::jsonb)
          FROM jsonb_array_elements_text(
            COALESCE(${userPreferences.hiddenRepos}, '[]'::jsonb) || ${JSON.stringify([parsed])}::jsonb
          ) value
        )`,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId));
    revalidateVisibility();
  });
}

export async function unhideRepoAction(
  fullName: string,
): Promise<ActionResult> {
  return runAction(async () => {
    const userId = await requireUserId();
    const parsed = fullNameSchema.parse(fullName);
    await db
      .update(userPreferences)
      .set({
        hiddenRepos: sql`(
          SELECT COALESCE(jsonb_agg(value), '[]'::jsonb)
          FROM jsonb_array_elements_text(COALESCE(${userPreferences.hiddenRepos}, '[]'::jsonb)) value
          WHERE value <> ${parsed}
        )`,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId));
    revalidateVisibility();
  });
}
