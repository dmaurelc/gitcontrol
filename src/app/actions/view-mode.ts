"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { userPreferences } from "@/lib/db/schema";
import { runAction, type ActionResult } from "@/lib/actions/result";

const viewModeSchema = z.object({
  scope: z.enum(["repos"]),
  mode: z.enum(["grid", "list"]),
});

export async function setViewModeAction(
  scope: string,
  mode: string,
): Promise<ActionResult> {
  return runAction(async () => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Not authenticated");
    const userId = session.user.id;
    const parsed = viewModeSchema.parse({ scope, mode });

    // Merge into filters jsonb without clobbering other keys. Postgres
    // jsonb_set creates the path if missing.
    await db
      .update(userPreferences)
      .set({
        filters: sql`jsonb_set(
          COALESCE(${userPreferences.filters}, '{}'::jsonb),
          ${`{viewMode,${parsed.scope}}`}::text[],
          to_jsonb(${parsed.mode}::text),
          true
        )`,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId));

    revalidatePath("/repositories");
  });
}
