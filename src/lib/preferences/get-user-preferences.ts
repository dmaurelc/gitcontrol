import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { userPreferences } from "@/lib/db/schema";

export type UserPreferences = {
  userId: string;
  theme: "light" | "dark" | "system";
  defaultView: "dashboard" | "repositories" | "stars";
  pinnedRepos: string[];
  filters: Record<string, unknown>;
};

const DEFAULTS: Omit<UserPreferences, "userId"> = {
  theme: "system",
  defaultView: "dashboard",
  pinnedRepos: [],
  filters: {},
};

/**
 * Returns the user's preferences row, creating it with defaults if it does
 * not exist yet.
 */
export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences> {
  const rows = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  if (rows[0]) {
    return {
      userId,
      theme: (rows[0].theme as UserPreferences["theme"]) ?? DEFAULTS.theme,
      defaultView:
        (rows[0].defaultView as UserPreferences["defaultView"]) ??
        DEFAULTS.defaultView,
      pinnedRepos: rows[0].pinnedRepos ?? [],
      filters: rows[0].filters ?? {},
    };
  }
  await db.insert(userPreferences).values({ userId, ...DEFAULTS });
  return { userId, ...DEFAULTS };
}
