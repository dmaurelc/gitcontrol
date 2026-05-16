import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    DATABASE_URL: z.string().url(),
    // Selects the Drizzle/PostgreSQL driver. "node-postgres" (default) is
    // used by Docker/Dokploy and local dev; "neon" uses the serverless
    // websocket driver for Vercel deploys against Neon.
    DB_DRIVER: z.enum(["node-postgres", "neon"]).default("node-postgres"),
    // REDIS_URL is only required when CACHE_ENABLED=true (default). On
    // Vercel staging with CACHE_ENABLED=false, Redis is omitted entirely.
    REDIS_URL: z.string().url().optional(),
    CACHE_ENABLED: z
      .union([z.literal("true"), z.literal("false")])
      .default("true")
      .transform((v) => v === "true"),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    TOKEN_ENCRYPTION_KEY: z
      .string()
      .min(64, "TOKEN_ENCRYPTION_KEY must be 64 hex chars (32 bytes)"),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
  })
  .refine((data) => !data.CACHE_ENABLED || !!data.REDIS_URL, {
    message: "REDIS_URL is required when CACHE_ENABLED=true",
    path: ["REDIS_URL"],
  });

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

// During Next's production build, route handlers are evaluated to collect
// page data. We don't want missing env vars to crash the build, so we return
// safe placeholders in that phase. Real validation happens at request time.
const BUILD_PLACEHOLDER: Env = {
  NODE_ENV: "production",
  DATABASE_URL: "postgres://build:build@localhost:5432/build",
  DB_DRIVER: "node-postgres",
  REDIS_URL: undefined,
  CACHE_ENABLED: false,
  GITHUB_CLIENT_ID: "build",
  GITHUB_CLIENT_SECRET: "build",
  TOKEN_ENCRYPTION_KEY: "0".repeat(64),
  BETTER_AUTH_SECRET: "build_secret_placeholder_at_least_32_chars",
  BETTER_AUTH_URL: "http://localhost:3000",
};

/**
 * Build phase detection has to be airtight: if it returns true at runtime,
 * we'd silently encrypt with an all-zero key. We require BOTH Next's own
 * NEXT_PHASE marker and the absence of a server-runtime hint. `next start`
 * sets NEXT_PHASE to "phase-production-server", and `next dev` to
 * "phase-development-server", so the only situation in which we accept the
 * placeholder is the actual `next build` step.
 */
function isBuildPhase(): boolean {
  if (process.env.NEXT_PHASE !== "phase-production-build") return false;
  // Defensive: if NODE_ENV is unset or anything other than "production",
  // we're not in a real build — bail out so missing env still throws.
  if (process.env.NODE_ENV !== "production") return false;
  return true;
}

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    if (isBuildPhase()) {
      // Don't fail the build; placeholders are only used during page-data
      // collection and are replaced by real env at runtime.
      return BUILD_PLACEHOLDER;
    }
    console.error(
      "Invalid environment variables:",
      z.treeifyError(parsed.error),
    );
    throw new Error("Invalid environment variables");
  }
  // Extra safety: in production, never accept the placeholder secrets even
  // if they somehow made it into the real environment. This protects
  // against a misconfigured Dokploy deploy that forgets to inject secrets.
  if (parsed.data.NODE_ENV === "production") {
    if (
      parsed.data.TOKEN_ENCRYPTION_KEY === BUILD_PLACEHOLDER.TOKEN_ENCRYPTION_KEY ||
      parsed.data.BETTER_AUTH_SECRET === BUILD_PLACEHOLDER.BETTER_AUTH_SECRET
    ) {
      throw new Error(
        "Refusing to start: TOKEN_ENCRYPTION_KEY or BETTER_AUTH_SECRET still match the build placeholder. Inject real secrets.",
      );
    }
  }
  cached = parsed.data;
  return cached;
}
