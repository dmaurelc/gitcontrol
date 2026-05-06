import "server-only";
import { Octokit } from "@octokit/rest";
import { graphql } from "@octokit/graphql";
import { getGithubToken } from "@/lib/auth/get-github-token";
import { UnauthorizedError } from "./errors";

const userAgent = "MaurelDev/0.1 (+https://github.com/dmaurelc/maureldev)";

export type GithubClients = {
  rest: Octokit;
  gql: typeof graphql;
  token: string;
};

/**
 * Build a per-request Octokit + GraphQL client bound to the user's decrypted
 * access token. Throws UnauthorizedError if the user has no linked GitHub
 * account.
 */
export async function getGithubClients(userId: string): Promise<GithubClients> {
  const token = await getGithubToken(userId);
  if (!token) throw new UnauthorizedError("No GitHub token for user");
  // Octokit logs 304 responses via console.error which surfaces as a red
  // overlay in Next dev. We treat 304 as a cache hit, so silence info/warn
  // and only forward true errors to console.error.
  const noopLog = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: (msg: string, ...rest: unknown[]) => {
      if (typeof msg === "string" && /\b304\b/.test(msg)) return;
      console.error(msg, ...rest);
    },
  };
  const rest = new Octokit({ auth: token, userAgent, log: noopLog });
  const gql = graphql.defaults({
    headers: { authorization: `token ${token}`, "user-agent": userAgent },
  });
  return { rest, gql, token };
}
