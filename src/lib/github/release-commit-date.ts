import "server-only";
import { getGithubClients } from "./client";
import { getRedis } from "@/lib/redis/client";

const TTL_SECONDS = 86400;

/**
 * Resolves the commit ISO date for a release tag. GitHub's `published_at`
 * reflects when the Release row was created (immutable), not when the
 * underlying code shipped. For a back-dated changelog we want the tagged
 * commit's date instead. Cached because tag→commit mappings are immutable.
 */
export async function getReleaseCommitDate(
  userId: string,
  owner: string,
  repo: string,
  tag: string,
): Promise<string | null> {
  const redis = getRedis();
  const key = `release:commitdate:${owner}/${repo}:${tag}`;

  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) return cached;
    } catch {
      // ignore
    }
  }

  const { rest } = await getGithubClients(userId);
  try {
    const ref = await rest.git.getRef({ owner, repo, ref: `tags/${tag}` });
    let sha = ref.data.object.sha;
    // Annotated tags need a second hop: tag object → commit sha.
    if (ref.data.object.type === "tag") {
      const tagObj = await rest.git.getTag({ owner, repo, tag_sha: sha });
      sha = tagObj.data.object.sha;
    }
    const commit = await rest.git.getCommit({ owner, repo, commit_sha: sha });
    const date = commit.data.committer?.date ?? commit.data.author?.date ?? null;
    if (date && redis) {
      try {
        await redis.set(key, date, "EX", TTL_SECONDS);
      } catch {
        // ignore
      }
    }
    return date;
  } catch {
    return null;
  }
}
