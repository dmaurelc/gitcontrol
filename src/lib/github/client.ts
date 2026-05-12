import "server-only";
import { Octokit } from "@octokit/rest";
import { graphql } from "@octokit/graphql";
import { getGithubToken } from "@/lib/auth/get-github-token";
import { UnauthorizedError } from "./errors";

const userAgent = "GitControl/0.1 (+https://github.com/dmaurelc/gitcontrol)";

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
  // Octokit logs non-2xx responses via console.error which surfaces as a red
  // overlay in Next dev. We handle 304/403/404/410/422 as expected control-flow
  // (cache hits, missing scopes, private/deleted repos, deleted issues) and
  // silence them. Genuine unexpected statuses still bubble to console.error.
  const SILENT_STATUS = /\b(?:304|403|404|410|422)\b/;
  const noopLog = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: (msg: string, ...rest: unknown[]) => {
      if (typeof msg === "string" && SILENT_STATUS.test(msg)) return;
      console.error(msg, ...rest);
    },
  };
  const rest = new Octokit({ auth: token, userAgent, log: noopLog });
  const gql = graphql.defaults({
    headers: { authorization: `token ${token}`, "user-agent": userAgent },
  });
  return { rest, gql, token };
}
