import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { account } from "@/lib/db/schema";
import { getEnv } from "@/lib/env";
import { getRedis } from "@/lib/redis/client";
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
    // Redis-backed key/value store; Better Auth uses this for rate-limit
    // counters (and any other secondary state) so limits survive restarts
    // and shard correctly across containers behind Dokploy/Traefik.
    secondaryStorage: {
      get: async (key) => {
        const raw = await getRedis().get(`auth_ss:${key}`);
        return raw ?? null;
      },
      set: async (key, value, ttl) => {
        const r = getRedis();
        if (ttl && ttl > 0) {
          await r.set(`auth_ss:${key}`, value, "EX", ttl);
        } else {
          await r.set(`auth_ss:${key}`, value);
        }
      },
      delete: async (key) => {
        await getRedis().del(`auth_ss:${key}`);
      },
    },
    rateLimit: {
      enabled: env.NODE_ENV === "production",
      window: 60,
      max: 100,
      storage: "secondary-storage",
      // Tighter limits on the OAuth surface to slow credential-stuffing
      // and callback abuse without breaking the legitimate flow.
      customRules: {
        "/sign-in/social": { window: 60, max: 10 },
        "/callback/github": { window: 60, max: 10 },
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
    if (typeof value === "function")
      return (value as (...args: unknown[]) => unknown).bind(inner);
    return Reflect.get(inner as object, prop, receiver);
  },
}) as AuthInstance;

export type Session = AuthInstance["$Infer"]["Session"];
