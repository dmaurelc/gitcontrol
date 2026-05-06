import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { account } from "@/lib/db/schema";
import { getEnv } from "@/lib/env";
import { encryptToJson } from "./encryption";

export const GITHUB_OAUTH_SCOPES = [
  "read:user",
  "user:email",
  "repo",
  "read:org",
  "read:packages",
  "read:project",
];

type AuthInstance = ReturnType<typeof createAuth>;

function createAuth() {
  const env = getEnv();
  return betterAuth({
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
}

const globalForAuth = globalThis as unknown as { authInstance?: AuthInstance };

function getAuth(): AuthInstance {
  if (!globalForAuth.authInstance) {
    globalForAuth.authInstance = createAuth();
  }
  return globalForAuth.authInstance;
}

// Lazy proxy: env vars are validated only when auth is actually used at
// request time, not when this module is imported during Next's build-time
// page-data collection.
export const auth = new Proxy({} as AuthInstance, {
  get(_t, prop, receiver) {
    const inner = getAuth() as unknown as Record<PropertyKey, unknown>;
    const value = inner[prop as string];
    if (typeof value === "function") return (value as Function).bind(inner);
    return Reflect.get(inner as object, prop, receiver);
  },
}) as AuthInstance;

export type Session = AuthInstance["$Infer"]["Session"];
