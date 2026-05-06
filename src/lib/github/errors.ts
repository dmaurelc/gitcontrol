import "server-only";

export class GithubError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "GithubError";
    this.status = status;
  }
}

export class UnauthorizedError extends GithubError {
  constructor(message = "GitHub access token is invalid or expired") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends GithubError {
  constructor(message = "GitHub denied the request") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends GithubError {
  constructor(message = "GitHub resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends GithubError {
  retryAfterSeconds?: number;
  constructor(message = "GitHub rate limit exceeded", retryAfterSeconds?: number) {
    super(message, 429);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function mapGithubError(err: unknown): GithubError {
  const e = err as { status?: number; message?: string; response?: { headers?: Record<string, string> } };
  const status = e?.status ?? 500;
  const msg = e?.message ?? "GitHub request failed";
  if (status === 401) return new UnauthorizedError(msg);
  if (status === 403) {
    const remaining = e?.response?.headers?.["x-ratelimit-remaining"];
    if (remaining === "0") {
      const reset = Number(e?.response?.headers?.["x-ratelimit-reset"]);
      const now = Math.floor(Date.now() / 1000);
      const retry = isFinite(reset) && reset > now ? reset - now : undefined;
      return new RateLimitError(msg, retry);
    }
    return new ForbiddenError(msg);
  }
  if (status === 404) return new NotFoundError(msg);
  if (status === 429) return new RateLimitError(msg);
  return new GithubError(msg, status);
}
