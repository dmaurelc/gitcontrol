import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { account } from "@/lib/db/schema";
import { getEnv } from "@/lib/env";
import { encryptToJson } from "./encryption";

const env = getEnv();

export const GITHUB_OAUTH_SCOPES = [
  "read:user",
  "user:email",
  "repo",
  "read:org",
  "read:packages",
  "read:project",
];

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg" }),
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      scope: GITHUB_OAUTH_SCOPES,
    },
  },
  databaseHooks: {
    account: {
      create: {
        // Encrypt accessToken at write time and clear plaintext column.
        after: async (acc) => {
          if (!acc?.accessToken) return;
          const enc = encryptToJson(acc.accessToken);
          await db
            .update(account)
            .set({ encryptedAccessToken: enc, accessToken: null })
            .where(eq(account.id, acc.id));
        },
      },
      update: {
        // OAuth refresh path: re-encrypt new accessToken.
        after: async (acc) => {
          if (!acc?.accessToken) return;
          const enc = encryptToJson(acc.accessToken);
          await db
            .update(account)
            .set({ encryptedAccessToken: enc, accessToken: null })
            .where(eq(account.id, acc.id));
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
