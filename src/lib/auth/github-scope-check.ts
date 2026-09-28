import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { account } from "@/lib/db/schema";
import { parseScopes } from "./github-scopes";

export { parseScopes };

/**
 * Returns the OAuth scopes currently granted to the user's GitHub account.
 * Better Auth persists these in `account.scope` and merges incremental grants
 * from `linkSocial`, so this is the source of truth for scope checks.
 */
export async function getGithubScopes(userId: string): Promise<string[]> {
  const rows = await db
    .select({ scope: account.scope })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "github")))
    .limit(1);
  return parseScopes(rows[0]?.scope);
}

/** True when the granted scopes include the requested one. */
export async function hasGithubScope(
  userId: string,
  scope: string,
): Promise<boolean> {
  const scopes = await getGithubScopes(userId);
  return scopes.includes(scope);
}
