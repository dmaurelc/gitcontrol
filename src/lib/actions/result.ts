import "server-only";
import { GithubError } from "@/lib/github/errors";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; code?: ActionErrorCode };

export type ActionErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "validation"
  | "unknown";

function mapGithubMessage(err: GithubError): {
  message: string;
  code: ActionErrorCode;
} {
  switch (err.status) {
    case 401:
      return {
        message: "Your GitHub session expired. Sign in again.",
        code: "unauthorized",
      };
    case 403:
      // Could be permissions or rate limit; errors.ts already split them.
      if (err.name === "RateLimitError") {
        return {
          message:
            "GitHub rate limit reached. Try again later.",
          code: "rate_limited",
        };
      }
      return {
        message:
          "You don't have permission for this action on this repository.",
        code: "forbidden",
      };
    case 404:
      return {
        message: "Resource not found or no access.",
        code: "not_found",
      };
    case 429:
      return {
        message:
          "GitHub rate limit reached. Try again later.",
        code: "rate_limited",
      };
    default:
      return {
        message: err.message || "Error de GitHub.",
        code: "unknown",
      };
  }
}

/**
 * Wraps a server action body so thrown errors are mapped to a typed
 * ActionResult instead of bubbling. Lets `next/redirect` and `next/notFound`
 * keep working by re-throwing their digests.
 */
export async function runAction<T>(
  fn: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    const e = err as { digest?: string };
    if (typeof e?.digest === "string" && e.digest.startsWith("NEXT_")) {
      throw err;
    }
    if (err instanceof GithubError) {
      const m = mapGithubMessage(err);
      return { ok: false, error: m.message, code: m.code };
    }
    if (
      err &&
      typeof err === "object" &&
      "name" in err &&
      (err as { name?: string }).name === "ZodError"
    ) {
      return {
        ok: false,
        error: "Invalid data. Check the form.",
        code: "validation",
      };
    }
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "rate_limited"
    ) {
      const message =
        err instanceof Error ? err.message : "Demasiadas peticiones.";
      return {
        ok: false,
        error: message,
        code: "rate_limited",
      };
    }
    const msg =
      err instanceof Error ? err.message : "Error desconocido.";
    return { ok: false, error: msg, code: "unknown" };
  }
}
