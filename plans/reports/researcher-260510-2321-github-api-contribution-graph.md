# GitHub API Research: Contribution Graph Implementation

**Date:** 2026-05-10  
**Context:** maureldev self-hosted dashboard — contribution heatmap feature  
**Status:** Research complete

---

## Executive Summary

GitHub provides **three viable paths** for contribution data collection, each with distinct trade-offs:

1. **REST API Commits** (`/repos/{owner}/{repo}/commits`) — Best for simple backfill, supports date filtering, 5000 req/hr limit
2. **GraphQL with Cursor Pagination** (`repository.defaultBranchRef.target.history`) — Most efficient for large datasets, 5000 points/hr, separate rate limit pool
3. **Webhooks + Incremental Sync** (`push`, `pull_request`, `issues` events) — Real-time updates, avoids backfill, scales to many repos

**Recommendation:** Hybrid approach — **GraphQL for initial backfill + webhooks for incremental sync** minimizes API calls and respects rate limits.

---

## 1. API Endpoint Comparison

### REST API: GET `/repos/{owner}/{repo}/commits`

**Use case:** Single-repo exploration, small datasets, simple filtering

| Aspect | Details |
|--------|---------|
| **Endpoint** | `GET /repos/{owner}/{repo}/commits` |
| **Query params** | `since`, `until` (ISO 8601), `author`, `committer`, `path`, `sha`, `per_page` (1–100), `page` |
| **Response fields** | `sha`, `commit` (author, committer, message), `author`/`committer` objects, `stats` (additions, deletions), `files` array, `verification` |
| **Pagination** | Offset-based (`page`, `per_page`); defaults to 30/page, max 100/page |
| **Rate limit** | 5000 req/hr (authenticated) |
| **Data freshness** | Immediate (real-time) |
| **Backfill potential** | ✅ Supports `since`/`until` for date range queries |
| **Pain points** | Offset pagination scales poorly for large datasets (1000+ pages); ETag support for conditional requests |

**Example request:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.github.com/repos/owner/repo/commits?since=2024-01-01T00:00:00Z&until=2025-01-01T00:00:00Z&per_page=100"
```

---

### GraphQL: Cursor-Based Pagination

**Use case:** Efficient large-dataset queries, real-time + historical, multi-repo aggregation

**Query template:**
```graphql
query($owner: String!, $repo: String!, $after: String) {
  repository(owner: $owner, name: $repo) {
    defaultBranchRef {
      target {
        ... on Commit {
          history(first: 100, after: $after) {
            pageInfo {
              endCursor
              hasNextPage
            }
            edges {
              node {
                oid
                committedDate
                author {
                  user { login }
                  name
                  email
                }
                message
                additions
                deletions
              }
            }
          }
        }
      }
    }
  }
}
```

| Aspect | Details |
|--------|---------|
| **Endpoint** | `POST https://api.github.com/graphql` |
| **Query limits** | `first: 1–100` (per-page), complexity points system |
| **Pagination** | Cursor-based (`after`/`before`, `endCursor`/`startCursor`, `hasNextPage`) |
| **Rate limit** | 5000 points/hr, separate pool from REST |
| **Secondary limit** | Max 2000 points/minute |
| **Efficiency** | ⭐ Better for large datasets — single cursor jump vs. many offset requests |
| **Data available** | Commit history, PR/issue creation/update dates, author info, stats |
| **Backfill potential** | ✅ Can paginate full history; no date filtering in query, must filter client-side |
| **Pain points** | Complex nested structures; costs points proportional to query depth |

**Rate limit example:** A query fetching 100 commits costs ~10–20 points (depends on nested selections). At 5000 points/hr, backfilling 2 years of commits (e.g., 50k commits) takes ~1–2 API calls if paginated efficiently.

---

### Activity Events API: Limited Scope

**Use case:** Quick snapshots of recent activity (complementary, not primary)

| Aspect | Details |
|--------|---------|
| **Endpoints** | `GET /repos/{owner}/{repo}/events`, `GET /users/{username}/events` |
| **Data coverage** | 15+ event types (push, pull_request, issues, create, delete, etc.) |
| **Time window** | **Last 30 days only** — no backfill to 1–2 years |
| **Response limit** | Max 300 events per request |
| **Rate limit** | 5000 req/hr (authenticated) |
| **Verdict** | ❌ Not suitable as primary source for historical contribution graphs |

---

## 2. Rate Limit Strategy for Backfill

### Rate Limit Allocation

| API | Limit | Replenish | Notes |
|-----|-------|-----------|-------|
| REST | 5000 req/hr | Hourly | Includes all REST calls (commits, events, PRs, issues) |
| GraphQL | 5000 pts/hr | Hourly | Separate pool; more efficient for large payloads |
| GraphQL | 2000 pts/min | Per-minute | Secondary limit prevents burst abuse |

**Strategy: Hybrid REST + GraphQL**

1. **GraphQL for commits** (primary):
   - 50k commits over 2 years = ~20k–50k points (5–10 complex queries per batch)
   - Cost: 1–2 hours of quota
   - Scales to multiple repos (e.g., 10 repos = 10–20 hours, staggered over 1 week)

2. **REST for metadata** (if needed):
   - PRs, issues, reviews → separate REST pool
   - Reserve 1000–2000 req/hr for incremental updates

3. **Webhooks for real-time** (after backfill):
   - Zero API calls; event-driven
   - Instant data, no backoff needed

### Backfill Pseudocode

```python
# Backfill: GraphQL cursor-based pagination
async def backfill_commits_graphql(owner, repo, since_date, max_batch_size=100):
    cursor = None
    total_commits = 0
    
    while True:
        query = build_commit_history_query(owner, repo, first=100, after=cursor)
        
        # Check rate limit before request
        remaining = await get_rate_limit_remaining("GRAPHQL")
        if remaining < 100:  # ~1 query cost
            await sleep_until_reset()
        
        response = await graphql_query(query)
        commits = response["repository"]["defaultBranchRef"]["target"]["history"]
        
        # Store commits
        for edge in commits["edges"]:
            node = edge["node"]
            commit = {
                "sha": node["oid"],
                "date": node["committedDate"],
                "author": node["author"]["user"]["login"],
                "additions": node["additions"],
                "deletions": node["deletions"],
                "message": node["message"]
            }
            await store_commit(owner, repo, commit)
            total_commits += 1
        
        if not commits["pageInfo"]["hasNextPage"]:
            break
        
        cursor = commits["pageInfo"]["endCursor"]
        
        # Respect secondary rate limit (2000 pts/min)
        await sleep(100)  # ~1-2 seconds between requests to stay under 2000 pts/min
    
    return total_commits

# Incremental sync: Webhook-based (zero API cost after backfill)
async def on_webhook_push(event_payload):
    """
    GitHub sends push event with:
    - commits[]: array of pushed commits
    - ref: branch name
    - pusher: user info
    """
    for commit in event_payload["commits"]:
        await store_commit(
            owner=event_payload["repository"]["owner"]["name"],
            repo=event_payload["repository"]["name"],
            commit={
                "sha": commit["id"],
                "date": commit["timestamp"],
                "author": commit["author"]["username"],
                "message": commit["message"]
            }
        )
```

### Cost Estimate: 2-Year Backfill

Assume:
- **Repository:** 50k commits over 24 months
- **Batch size:** 100 commits/query
- **Cost per query:** ~20 points (includes nested author/stats fields)

```
Total queries needed: 50,000 / 100 = 500 queries
Points per query: ~20
Total points: 500 × 20 = 10,000 points
Rate limit: 5000 pts/hr
Time needed: 10,000 / 5000 = 2 hours (with queuing, 4–6 hours in practice)
```

**For 10 repos:** 40–60 hours over a week; spreads across days to avoid hourly spikes.

---

## 3. Data Collection: Commits vs. PRs vs. Issues

### What Counts as a "Contribution"?

GitHub's heatmap counts:
- **Commits pushed to main branch** (or default branch)
- **PRs opened, merged, reviewed**
- **Issues opened, commented**
- **PR reviews submitted**

### Collection Endpoints

| Contribution Type | Endpoint | Graphql | Note |
|---|---|---|---|
| Commits | `/repos/{owner}/{repo}/commits` | `repository.defaultBranchRef.target.history` | Primary; use since/until for range |
| PRs | `/repos/{owner}/{repo}/pulls?state=all` | `repository.pullRequests(first:100)` | Opened + merged; includes review data |
| Issues | `/repos/{owner}/{repo}/issues?state=all` | `repository.issues(first:100)` | Opened + closed |
| Reviews | `/repos/{owner}/{repo}/pulls/{pr}/reviews` | `pullRequest.reviews(first:100)` | Nested under PRs |
| Comments | `/repos/{owner}/{repo}/issues/comments` | `repository.issueComments(first:100)` | Issue + PR comments |

**Recommendation for maureldev MVP:**
Start with **commits only** (simplest, most data-rich). Expand to PRs/issues in phase-2 if needed.

---

## 4. Timezone Handling

### GitHub API Returns UTC

- All timestamps are ISO 8601 UTC (e.g., `2026-05-10T14:30:00Z`)
- API does **not** include original author's local timezone
- Example: Author in PST commits at 2:00 AM local time → API shows `2026-05-10T09:00:00Z` (UTC)

### Aggregation Strategy

**For contribution heatmap (day-level granularity):**

1. **Store all timestamps as UTC** in database
2. **Aggregate by UTC day** for server-side calculations:
   ```javascript
   const date = new Date(committedDate); // ISO 8601 UTC
   const utcDay = date.toISOString().split('T')[0]; // "2026-05-10"
   contributions[utcDay] = (contributions[utcDay] || 0) + 1;
   ```

3. **Client-side**: Apply user's local timezone when displaying:
   ```javascript
   const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
   const localDate = new Date(utcDate).toLocaleDateString('en-US', { timeZone: userTimezone });
   ```

**Caveat:** GitHub's heatmap uses UTC day boundaries, not user-local day boundaries. Maureldev should follow this convention for consistency.

---

## 5. Incremental Sync Strategy

### Option A: Polling (Not Recommended)

```
Pros: Simple; no infrastructure needed
Cons: Hits rate limits; adds API cost; delayed updates (hours behind)
Cost: 288 req/day × repos to check every 5 minutes
```

### Option B: Webhooks (Recommended)

```
Pros: Real-time; zero API cost; scales to many repos
Cons: Requires public URL + webhook registration; setup complexity
Cost: Free (payload-based, no API calls)
```

**Webhook events to subscribe:**
- `push` — commits to any branch
- `pull_request` — PR opened/closed/merged
- `issues` — issue opened/closed/commented
- `issue_comment` — comments on issues/PRs

**Webhook payload example (push event):**
```json
{
  "ref": "refs/heads/main",
  "commits": [
    {
      "id": "abc123...",
      "timestamp": "2026-05-10T14:30:00Z",
      "author": { "username": "dmaurelc" },
      "message": "feat: add contribution graph"
    }
  ],
  "repository": {
    "owner": { "name": "dmaurelc" },
    "name": "maureldev"
  }
}
```

### Recommended Schedule

1. **Initial backfill** (one-time): GraphQL, 2–6 hours over 1 week
2. **Webhook handler** (ongoing): Instant updates on push/PR/issue events
3. **Fallback sync** (daily): Check for any missed events via REST `since` filter
   - Cost: ~5 req/day/repo (minimal)

---

## 6. Data Freshness Trade-offs

| Strategy | Latency | Cost | Complexity |
|----------|---------|------|------------|
| **Polling every 5m** | 5 minutes | 288 req/day/repo | Low |
| **Polling every hour** | 1 hour | 24 req/day/repo | Low |
| **Webhooks only** | <1 second | Free | Medium |
| **Webhooks + daily fallback** | <1 second + catch-up | ~5 req/day/repo | Medium |
| **Webhooks + REST cache** | <1 second + hourly refresh | ~100 req/day/repo | High |

**Recommendation:** Webhooks + daily fallback.
- Instant updates for active developers
- Single daily catch-up query for robustness (e.g., missed webhook delivery)
- Total cost: ~5–10 API req/day, negligible vs. hourly polling

---

## 7. Library & Implementation Notes

### Octokit (Recommended)

```javascript
// REST with pagination helper
import { Octokit } from "@octokit/rest";
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Auto-paginate commits
const commits = await octokit.paginate(octokit.rest.repos.listCommits, {
  owner: "dmaurelc",
  repo: "maureldev",
  since: "2024-01-01T00:00:00Z",
  until: "2025-01-01T00:00:00Z",
  per_page: 100,
});

// GraphQL with cursor pagination (manual)
const { graphql } = require("@octokit/graphql");
const commits = await graphql(
  `query($owner: String!, $repo: String!, $after: String) { ... }`,
  { owner, repo, after: null, headers: { authorization: `token ${token}` } }
);
```

### Key Libraries
- **@octokit/rest** — REST API + pagination helpers
- **@octokit/graphql** — GraphQL client
- **octokit/plugin-paginate-rest** — Auto-pagination for REST endpoints

### ETags for Conditional Requests

REST API supports ETags to avoid counting toward rate limits:
```javascript
const response = await fetch('https://api.github.com/repos/owner/repo/commits', {
  headers: {
    'If-None-Match': previousETag, // Last ETag from previous request
  },
});
// 304 Not Modified = no rate limit consumed
```

---

## 8. Architectural Recommendations for maureldev

### Phase 1: Backfill (MVP)
1. **Backfill endpoint**: Use GraphQL `repository.defaultBranchRef.target.history` with cursor pagination
2. **Storage**: PostgreSQL table:
   ```sql
   CREATE TABLE contributions (
     id BIGSERIAL PRIMARY KEY,
     repo_id INTEGER NOT NULL,
     sha VARCHAR(40) UNIQUE NOT NULL,
     date DATE NOT NULL,
     author_login VARCHAR(255),
     additions INTEGER,
     deletions INTEGER,
     created_at TIMESTAMP DEFAULT NOW(),
     FOREIGN KEY (repo_id) REFERENCES repositories(id),
     INDEX (repo_id, date)
   );
   ```
3. **Batch size**: 100 commits/query, 1–2 second delay between requests
4. **Duration**: ~2–6 hours for 50k commits (single repo), stagger multi-repo over 1 week

### Phase 2: Real-time Sync
1. **Webhook handler**: POST endpoint at `/api/webhooks/github`
2. **Webhook registration**: Manual per-repo (or use GitHub App for automation)
3. **Payload processing**: Extract commits, PRs, issues; insert/upsert into DB
4. **Queue for reliability**: Use job queue (e.g., Bull, BullMQ) to handle spikes

### Phase 3: Frontend Heatmap
1. **Aggregation query**: `SELECT DATE(date), COUNT(*) FROM contributions GROUP BY DATE(date)`
2. **Visualization**: Use existing heatmap library (e.g., cal-heatmap, recharts) with daily buckets
3. **Timezone**: Display in UTC (GitHub standard); optionally offer user-local view

---

## Trade-offs & Adoption Risk

### REST API
| Pro | Con |
|-----|-----|
| Simple; straightforward | Offset pagination scales poorly |
| Date filtering native | Hits rate limit faster for large datasets |
| | ETag support required for efficiency |

**Risk:** High if >5 repos or >1M total commits; offset pagination becomes a bottleneck.

### GraphQL
| Pro | Con |
|-----|-----|
| Cursor pagination efficient | Higher learning curve |
| Separate rate limit pool (5000 pts) | No date filtering in query; client-side filter required |
| Scales to 10+ repos | Complex query cost varies |

**Risk:** Medium; cursor pagination stable, but cost calculation requires testing per schema.

### Webhooks
| Pro | Con |
|-----|-----|
| Real-time; zero API cost | Requires public endpoint + HTTPS |
| Scales to unlimited repos | Webhook registration manual or GitHub App setup |
| | Requires reliable queue/retry logic |

**Risk:** Medium; infrastructure dependency (need reliable webhook delivery system).

---

## Unresolved Questions

1. **Dashboard scope**: Will maureldev track multiple repos or single repo? (Affects rate limit planning)
2. **User timezone preference**: Store in app settings, or default to UTC throughout?
3. **Webhook infrastructure**: Is a public endpoint available, or should backfill-only approach be initial MVP?
4. **Data retention**: How many years of historical data needed? (Affects backfill time and storage)
5. **PR/Issue contribution weighting**: Equal weight to commits, or different? (Affects aggregation logic)

---

## Sources

- [REST API endpoints for commits - GitHub Docs](https://docs.github.com/en/rest/commits/commits)
- [Rate limits for the REST API - GitHub Docs](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [Rate limits and query limits for the GraphQL API - GitHub Docs](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api)
- [Using pagination in the GraphQL API - GitHub Docs](https://docs.github.com/en/graphql/guides/using-pagination-in-the-graphql-api)
- [REST API endpoints for events - GitHub Docs](https://docs.github.com/en/rest/activity/events)
- [Timezones and the REST API - GitHub Docs](https://docs.github.com/en/rest/using-the-rest-api/timezones-and-the-rest-api)
- [Webhook events and payloads - GitHub Docs](https://docs.github.com/en/webhooks/webhook-events-and-payloads)
- [Octokit plugin-paginate-rest.js - GitHub](https://github.com/octokit/plugin-paginate-rest.js/)
- [Mastering GitHub API Pagination - moldstud.com](https://moldstud.com/articles/p-mastering-github-api-pagination-a-complete-guide-to-handling-large-datasets)
- [Getting GitHub User Contributions - Den Delimarsky](https://den.dev/blog/get-github-contributions-api/)

