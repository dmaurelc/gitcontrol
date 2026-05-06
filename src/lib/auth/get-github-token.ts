import "server-only";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { account } from "@/lib/db/schema";
import { decryptFromJson } from "./encryption";

/**
 * Returns the decrypted GitHub access token for a given user, or null if the
 * user has no GitHub account linked or the token is missing.
 */
export async function getGithubToken(userId: string): Promise<string | null> {
  const rows = await db
    .select({
      enc: account.encryptedAccessToken,
      plain: account.accessToken,
    })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "github")))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  if (row.enc) return decryptFromJson(row.enc);
  // Fallback: token stored in plaintext (should not happen after the create
  // hook, but covers race conditions on first write).
  return row.plain ?? null;
}
