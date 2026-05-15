import "server-only";
import { getGithubClients } from "./client";
import { invalidate } from "./cache";
import { mapGithubError } from "./errors";

// Write operations against the user's GitHub repos. Kept in a separate
// module from `service.ts` so the read object stays cohesive and the
// write surface is small + auditable.
//
// All methods invalidate relevant Redis cache buckets after success so the
// explorer's reads reflect the new state without a manual refresh.
export const githubServiceWrite = {
  /**
   * Creates a new branch off an existing commit SHA.
   * GitHub: POST /repos/{owner}/{repo}/git/refs with ref=refs/heads/<name>.
   * Invalidates the user's branches cache for this repo.
   */
  async createBranchRef(
    userId: string,
    owner: string,
    repo: string,
    branchName: string,
    baseSha: string,
  ): Promise<{ ref: string; sha: string }> {
    const { rest } = await getGithubClients(userId);
    try {
      const res = await rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      });
      await invalidate(userId, "branches");
      return { ref: res.data.ref, sha: res.data.object.sha };
    } catch (err) {
      throw mapGithubError(err);
    }
  },

  /**
   * Create or update a single file on a branch (one commit). The `sha`
   * arg is required when updating (it's the file blob sha returned by
   * `repos.getContent`); omit when creating.
   * GitHub: PUT /repos/{owner}/{repo}/contents/{path}.
   * Invalidates commits + contents caches.
   */
  async createOrUpdateFile(
    userId: string,
    owner: string,
    repo: string,
    args: {
      path: string;
      message: string;
      content: string; // utf-8 plain text — we encode to base64
      branch: string;
      sha?: string;
    },
  ): Promise<{ commitSha: string; contentSha: string | null }> {
    const { rest } = await getGithubClients(userId);
    try {
      const res = await rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: args.path,
        message: args.message,
        content: Buffer.from(args.content, "utf-8").toString("base64"),
        branch: args.branch,
        sha: args.sha,
      });
      await invalidate(userId, "commits");
      await invalidate(userId, "contents");
      return {
        commitSha: res.data.commit.sha ?? "",
        contentSha: res.data.content?.sha ?? null,
      };
    } catch (err) {
      throw mapGithubError(err);
    }
  },

  /**
   * Opens a new pull request.
   * GitHub: POST /repos/{owner}/{repo}/pulls.
   * Invalidates the user's PRs cache.
   */
  async createPullRequest(
    userId: string,
    owner: string,
    repo: string,
    args: {
      title: string;
      head: string;
      base: string;
      body?: string;
      draft?: boolean;
    },
  ): Promise<{ number: number; html_url: string }> {
    const { rest } = await getGithubClients(userId);
    try {
      const res = await rest.pulls.create({
        owner,
        repo,
        title: args.title,
        head: args.head,
        base: args.base,
        body: args.body,
        draft: args.draft,
      });
      await invalidate(userId, "prs");
      return { number: res.data.number, html_url: res.data.html_url };
    } catch (err) {
      throw mapGithubError(err);
    }
  },
};
