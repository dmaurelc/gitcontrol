import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  TOKEN_ENCRYPTION_KEY: z
    .string()
    .min(64, "TOKEN_ENCRYPTION_KEY must be 64 hex chars (32 bytes)"),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

// During Next's production build, route handlers are evaluated to collect
// page data. We don't want missing env vars to crash the build, so we return
// safe placeholders in that phase. Real validation happens at request time.
const BUILD_PLACEHOLDER: Env = {
  NODE_ENV: "production",
  DATABASE_URL: "postgres://build:build@localhost:5432/build",
  REDIS_URL: "redis://localhost:6379",
  GITHUB_CLIENT_ID: "build",
  GITHUB_CLIENT_SECRET: "build",
  TOKEN_ENCRYPTION_KEY: "0".repeat(64),
  BETTER_AUTH_SECRET: "build_secret_placeholder_at_least_32_chars",
  BETTER_AUTH_URL: "http://localhost:3000",
};

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
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
  cached = parsed.data;
  return cached;
}
