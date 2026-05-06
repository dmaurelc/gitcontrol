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
  const rest = new Octokit({ auth: token, userAgent });
  const gql = graphql.defaults({
    headers: { authorization: `token ${token}`, "user-agent": userAgent },
  });
  return { rest, gql, token };
}
