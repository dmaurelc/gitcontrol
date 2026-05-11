# Activity Tracking Schema Research Report

**Date:** 2026-05-10 | **Researcher:** Technical Analyst | **Project:** maureldev contribution graph

---

## Executive Summary

For maureldev's contribution graph feature on Postgres 16 + Drizzle, **recommend a hybrid dual-table approach with daily rollups**:
1. **Raw `activity_events` table** (immutable log of GitHub API fetches)
2. **Pre-aggregated `user_activity_daily` table** (userId + date + counts)

**Key decision:** Daily granularity (not hourly) balances query simplicity vs. storage. GitHub contribution graphs display at 1-day precision anyway. Materialized view approach avoided—unnecessary overhead for maureldev's scale (self-hosted, single/small team).

**Concurrent write pattern:** Drizzle `onConflictDoUpdate` with `sql.raw` for atomic increment on same-day re-runs. No race conditions possible with composite (userId, date) primary key.

---

## 1. Table Structure: Single vs. Separate

### Option A: Single Denormalized Table (RECOMMENDED)
```sql
CREATE TABLE user_activity_daily (
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  commits INT NOT NULL DEFAULT 0,
  prs_opened INT NOT NULL DEFAULT 0,
  prs_reviewed INT NOT NULL DEFAULT 0,
  issues_opened INT NOT NULL DEFAULT 0,
  issues_closed INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (user_id, activity_date)
);
```

**Rationale:**
- Single row per user per day = simple queries ("get activity for user between dates")
- GitHub's contribution graph is daily-granular; matching that precision avoids artificial joins
- No performance benefit to separate tables (no significant data duplication)
- Simpler indexing strategy

**Trade-off:** Denormalization is acceptable here because:
- Activity counts are immutable per date (backfills don't change past days)
- Only 365 rows per user per year
- Query patterns are time-range focused, not breakdown-focused

### Option B: Normalized Separate Tables per Type
```sql
CREATE TABLE commits (user_id TEXT, activity_date DATE, count INT);
CREATE TABLE prs_opened (user_id TEXT, activity_date DATE, count INT);
... (3 more tables)
```
**Verdict: AVOID.** Causes:
- Redundant schema (5 identical structures)
- Requires 5 joins for "full day activity" queries
- Higher storage footprint
- No query performance gain for time-range filters

### Option C: Event Log Only (No Pre-Aggregation)
```sql
CREATE TABLE activity_events (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id),
  event_type VARCHAR(20) NOT NULL, -- 'commit', 'pr_opened', etc.
  event_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**Verdict: AVOID for primary queries.** Reason:
- Contribution graphs are shown frequently; scanning millions of events per request is prohibitive
- Even with indexing, aggregations over wide date ranges cause full-table scans
- GitHub API backfills thousands of events; aggregating on read is wasteful

**Use raw events ONLY if:**
- Detailed audit trail is regulatory requirement
- Real-time event drilling (click on a date → see individual events) is a feature

---

## 2. Time Aggregation: Daily Rollups vs. Hourly vs. Hybrid

### Recommendation: Daily Rollups ONLY

**Why not hourly?**
1. GitHub contribution graph displays at 1-day granularity (no hourly breakdown shown)
2. Storage cost: 365 rows/user/year (daily) vs. 8760 rows/year (hourly) = 24x overhead
3. Query patterns in contribution graphs are always date-range scans, not time-of-day analysis
4. Backfill complexity increases (hourly requires multiple API calls per day; daily requires one)

**Why not both?**
- Violates YAGNI. Adds maintenance burden for features not in MVP spec
- Materialized view refresh complexity doubles
- No current use case for "show me this week's activity by hour"

**Daily rollup structure:**
```typescript
interface UserActivityDaily {
  userId: string;
  activityDate: Date; // stored as DATE type (no time component)
  commits: number;
  prsOpened: number;
  prsReviewed: number;
  issuesOpened: number;
  issuesClosed: number;
  updatedAt: Date;
}
```

---

## 3. Indexing Strategy for Range Queries

### Primary Index: Composite on (user_id, activity_date)
Already covered by PRIMARY KEY—PostgreSQL automatically creates BTREE.

**Why this is optimal:**
- Query pattern: `WHERE user_id = ? AND activity_date BETWEEN ? AND ?`
- BTREE with (user_id, activity_date) ordering = perfect index match
- Avoids full-table scan; index is traversable in order

### Secondary: BRIN Index on activity_date (for large history)
```typescript
// In Drizzle migration or raw SQL
sql`
CREATE INDEX idx_user_activity_daily_date ON user_activity_daily 
USING BRIN (activity_date);
`
```

**Rationale:** 
- BRIN indexes (Block Range Index, Postgres 9.5+) are space-efficient for time-series data
- Trades some query speed for 10-100x less disk space vs. BTREE
- **Only add if** backfill grows to 100k+ rows; for MVP, composite PRIMARY KEY suffices

**CRITICAL:** Do NOT use date_trunc in WHERE clause—it prevents index usage.
```typescript
// ❌ WRONG (full table scan)
where: sql`date_trunc('day', activity_date) = ${date}`

// ✅ CORRECT (index-friendly)
where: and(
  gte(userActivityDaily.activityDate, startDate),
  lt(userActivityDaily.activityDate, endDate)
)
```

### No Expression Index Needed
```typescript
// ❌ AVOID
CREATE INDEX idx_date_trunc ON user_activity_daily (date_trunc('day', activity_date));

// ✅ Not needed; activityDate is already DATE type
```

---

## 4. Concurrent Writes: Upsert Pattern

### Problem: Multiple refresh jobs may hit same date simultaneously
- Scheduled job runs every 6 hours → backfill commits, PRs, issues separately
- User manually triggers sync while scheduled job is running
- Network timeout → retry logic fires while previous attempt still processing

### Solution: Drizzle onConflictDoUpdate with Atomic Increment

```typescript
import { sql } from 'drizzle-orm';
import { userActivityDaily } from '@/lib/db/schema';

async function upsertDailyActivity(
  userId: string,
  activityDate: Date,
  metrics: {
    commits: number;
    prsOpened: number;
    prsReviewed: number;
    issuesOpened: number;
    issuesClosed: number;
  }
) {
  return await db
    .insert(userActivityDaily)
    .values({
      userId,
      activityDate,
      ...metrics,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userActivityDaily.userId, userActivityDaily.activityDate],
      set: {
        commits: metrics.commits, // Full replace if backfilling fresh
        prsOpened: metrics.prsOpened,
        prsReviewed: metrics.prsReviewed,
        issuesOpened: metrics.issuesOpened,
        issuesClosed: metrics.issuesClosed,
        updatedAt: sql`NOW()`,
      },
    });
}
```

**Why this works:**
- Composite PRIMARY KEY (user_id, activity_date) prevents race conditions by design
- `onConflictDoUpdate` is atomic—if row exists, update it; if not, insert
- No locking needed; Postgres handles via internal row-level locks
- `sql.raw(excluded.column)` available if incremental updates needed (explained below)

### Incremental vs. Full-Replace Decision

**Full-replace pattern (RECOMMENDED for backfills):**
```typescript
// Backfill: fetch fresh data from GitHub API, replace entire day
set: {
  commits: metrics.commits,
  prsOpened: metrics.prsOpened,
  // ... all fields
}
```
- Safe because GitHub API data is canonical source of truth
- Simple logic: no need to read existing row
- Idempotent (re-running same backfill gives same result)

**Incremental pattern (for real-time events only):**
```typescript
// If tracking individual event inserts from webhook:
set: {
  commits: sql`${userActivityDaily.commits} + 1`,
  updatedAt: sql`NOW()`,
}
```
- Use only if tracking single events in real-time
- Requires careful increment logic (avoid double-counts if webhook retries)
- **Not applicable to GitHub API backfills** (API already provides counts)

---

## 5. Data Retention & Archive Strategy

### Retention Policy for MVP
**Keep all data indefinitely.** Rationale:
- Activity data is non-sensitive (public on GitHub anyway)
- Storage cost negligible: 5 ints + 2 timestamps per day = ~50 bytes/row
- 100 users × 365 days × 50 bytes = ~1.8 MB/year
- Contribution graphs benefit from 10+ year history (employer background checks, "hacker" credibility)

### If Storage Becomes Concern (Post-MVP)
```sql
-- Archive to separate table after 2 years
CREATE TABLE user_activity_daily_archive AS
  SELECT * FROM user_activity_daily
  WHERE activity_date < CURRENT_DATE - INTERVAL '2 years';

DELETE FROM user_activity_daily
  WHERE activity_date < CURRENT_DATE - INTERVAL '2 years';
```

**Better long-term:** Enable Postgres table compression (PostgreSQL 14+)
```sql
ALTER TABLE user_activity_daily SET (fillfactor = 50);
VACUUM FULL user_activity_daily;
```
Reduces disk footprint without losing data.

---

## 6. Backfill Performance: Bulk Insert Best Practices

### Drizzle Batch Insert (for 1000+ rows)
```typescript
import { db } from '@/lib/db/client';
import { userActivityDaily } from '@/lib/db/schema';

async function backfillUserActivity(userId: string, events: ActivityEvent[]) {
  // Aggregate events by date
  const dailyMetrics = aggregateEventsByDate(events);
  
  // Batch insert in chunks (prevent single query timeout)
  const CHUNK_SIZE = 500;
  
  for (let i = 0; i < dailyMetrics.length; i += CHUNK_SIZE) {
    const chunk = dailyMetrics.slice(i, i + CHUNK_SIZE);
    
    await db
      .insert(userActivityDaily)
      .values(
        chunk.map(day => ({
          userId,
          activityDate: day.date,
          commits: day.commitCount,
          prsOpened: day.prsOpenedCount,
          prsReviewed: day.prsReviewedCount,
          issuesOpened: day.issuesOpenedCount,
          issuesClosed: day.issuesClosedCount,
          updatedAt: new Date(),
        }))
      )
      .onConflictDoUpdate({
        target: [userActivityDaily.userId, userActivityDaily.activityDate],
        set: {
          commits: sql`excluded.commits`,
          prsOpened: sql`excluded.prs_opened`,
          prsReviewed: sql`excluded.prs_reviewed`,
          issuesOpened: sql`excluded.issues_opened`,
          issuesClosed: sql`excluded.issues_closed`,
          updatedAt: sql`NOW()`,
        },
      });
  }
}

function aggregateEventsByDate(
  events: ActivityEvent[]
): Array<{ date: Date; commitCount: number; ... }> {
  const map = new Map<string, any>();
  
  for (const event of events) {
    const dateKey = event.date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!map.has(dateKey)) {
      map.set(dateKey, {
        date: new Date(dateKey),
        commitCount: 0,
        prsOpenedCount: 0,
        prsReviewedCount: 0,
        issuesOpenedCount: 0,
        issuesClosedCount: 0,
      });
    }
    
    const day = map.get(dateKey);
    if (event.type === 'commit') day.commitCount++;
    else if (event.type === 'pr_opened') day.prsOpenedCount++;
    else if (event.type === 'pr_reviewed') day.prsReviewedCount++;
    else if (event.type === 'issue_opened') day.issuesOpenedCount++;
    else if (event.type === 'issue_closed') day.issuesClosedCount++;
  }
  
  return Array.from(map.values());
}
```

**Performance tuning:**
- Chunk size 500–1000: balances memory vs. network round trips
- Use `onConflictDoUpdate` to handle re-runs (no manual duplicate check needed)
- Aggregate client-side before batch insert (simpler than bulk SQL aggregation)

**Expected throughput:** 
- 500 rows in ~100ms (local Postgres)
- 10,000 rows (20 years per user) in ~2 seconds

### Alternative: Raw SQL for Maximum Performance (if needed)
```typescript
// Only if Drizzle batch is too slow (unlikely)
const rows = aggregateEventsByDate(events)
  .map(day => `('${userId}', '${day.date.toISOString().split('T')[0]}', ${day.commitCount}, ...)`)
  .join(',');

await db.execute(
  sql`
    INSERT INTO user_activity_daily (user_id, activity_date, commits, ...)
    VALUES ${sql.raw(rows)}
    ON CONFLICT (user_id, activity_date) DO UPDATE
    SET commits = excluded.commits, ...
  `
);
```
**Caution:** Requires careful SQL escaping. Drizzle batch is safer and nearly as fast.

---

## 7. Query Examples: Activity Over Date Range

### Sample Queries (Drizzle)

**1. Get all activity for a user in date range:**
```typescript
import { and, gte, lt } from 'drizzle-orm';

const startDate = new Date('2024-01-01');
const endDate = new Date('2024-12-31');

const activity = await db
  .select()
  .from(userActivityDaily)
  .where(
    and(
      eq(userActivityDaily.userId, userId),
      gte(userActivityDaily.activityDate, startDate),
      lt(userActivityDaily.activityDate, endDate)
    )
  )
  .orderBy(asc(userActivityDaily.activityDate));
```

**2. Aggregate activity across date range:**
```typescript
const stats = await db
  .select({
    totalCommits: sum(userActivityDaily.commits),
    totalPrsOpened: sum(userActivityDaily.prsOpened),
    totalIssuesOpened: sum(userActivityDaily.issuesOpened),
    daysActive: count(userActivityDaily.activityDate),
  })
  .from(userActivityDaily)
  .where(
    and(
      eq(userActivityDaily.userId, userId),
      gte(userActivityDaily.activityDate, startDate),
      lt(userActivityDaily.activityDate, endDate)
    )
  );
```

**3. Get contribution graph data (heatmap format):**
```typescript
const heatmap = await db
  .select({
    date: userActivityDaily.activityDate,
    count: sql<number>`
      ${userActivityDaily.commits} + 
      ${userActivityDaily.prsOpened} + 
      ${userActivityDaily.issuesOpened}
    `,
  })
  .from(userActivityDaily)
  .where(
    and(
      eq(userActivityDaily.userId, userId),
      gte(userActivityDaily.activityDate, oneYearAgo),
      lte(userActivityDaily.activityDate, today)
    )
  )
  .orderBy(asc(userActivityDaily.activityDate));
```

**Performance:** All queries should return in <50ms with proper indexing.

---

## 8. Materialized Views: Worth It?

### Not Recommended for MVP

PostgreSQL materialized views compute aggregations and cache the result. Example:
```sql
CREATE MATERIALIZED VIEW user_activity_stats AS
SELECT
  user_id,
  DATE_TRUNC('month', activity_date)::DATE as month,
  SUM(commits) as total_commits,
  SUM(prs_opened) as total_prs_opened
FROM user_activity_daily
GROUP BY user_id, DATE_TRUNC('month', activity_date);
```

**Verdict: AVOID.**
- `user_activity_daily` already IS a materialized aggregation (daily rollup)
- A materialized view ON TOP of daily data = double aggregation (pointless)
- Adds refresh logic, indexing, and staleness management
- No performance win for maureldev's scale (few thousand users max)

**When to reconsider (post-MVP if needed):**
- Dashboards querying 100k+ users simultaneously
- Real-time aggregations across all users (monthly stats, leaderboards)
- Currently: contribution graphs are per-user; no cross-user aggregation

---

## 9. TimescaleDB vs. Plain Postgres?

### Recommendation: Plain Postgres 16 (no extension needed)

| Aspect | Plain Postgres | TimescaleDB |
|--------|---|---|
| **Setup complexity** | None (already installed) | Install + enable extension |
| **Query performance** | Sufficient for daily data | 10-50x faster for 100k+ rows |
| **Chunk management** | Manual (or materialized views) | Automatic hypertable chunking |
| **Continuous aggregates** | Materialized views only | Native continuous aggregates |
| **Storage overhead** | Standard B-tree indexing | 20-30% more compact with BRIN |
| **Operational burden** | Minimal | Upgrade, migration, extension updates |

**For maureldev (MVP):**
- Data scale: ~100 users × 365 days = 36,500 rows total (fits in memory)
- Query patterns: Simple date-range filters (no complex time bucketing)
- Plain Postgres is sufficient; TimescaleDB is over-engineered

**Revisit TimescaleDB if:**
- Scaling to 10,000+ users
- Hourly granularity needed (currently day-only)
- Real-time continuous aggregates required (leaderboards, trending)

---

## 10. Drizzle Schema Definition

```typescript
import {
  pgTable,
  text,
  integer,
  date,
  timestamp,
  primaryKey,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { user } from './user';

export const userActivityDaily = pgTable(
  'user_activity_daily',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    activityDate: date('activity_date').notNull(),
    commits: integer('commits').notNull().default(0),
    prsOpened: integer('prs_opened').notNull().default(0),
    prsReviewed: integer('prs_reviewed').notNull().default(0),
    issuesOpened: integer('issues_opened').notNull().default(0),
    issuesClosed: integer('issues_closed').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.activityDate],
    }),
  ]
);

export type UserActivityDaily = typeof userActivityDaily.$inferSelect;
```

---

## Source Credibility Assessment

| Source | Credibility | Use Case |
|--------|---|---|
| Drizzle ORM official docs | ✅ Authoritative | Syntax, batch API, upsert patterns |
| PostgreSQL official docs | ✅ Authoritative | date_trunc, BRIN indexes, materialized views |
| Timescale blog (TimescaleDB creators) | ✅ High | Time-series best practices, continuous aggregates |
| GitHub API documentation | ✅ Authoritative | Contribution data format |
| AWS RDS PostgreSQL guide | ✅ High | Index strategies, partitioning (reference only) |
| Neon documentation | ✅ High | PostgreSQL edge cases, performance tuning |

**Note:** No single-source conclusions. All major decisions cross-referenced across 3+ sources.

---

## Adoption Risk Summary

| Risk | Severity | Mitigation |
|---|---|---|
| **Concurrent upsert race conditions** | Low | Composite PK handles atomically; no custom locking needed |
| **Index bloat during backfill** | Low | Batch inserts in 500-row chunks; standard maintenance |
| **Date range query performance** | Low | BTREE on (user_id, activity_date) covers access pattern perfectly |
| **Postgres version drift** | Low | Feature set (date, upsert) stable since Postgres 11 |
| **Storage growth** | Very low | ~2 MB/year per user; archival cheap |
| **GitHub API backfill failures** | Medium | Retry logic with exponential backoff required (outside DB scope) |

---

## Architectural Fit Assessment

✅ **Fits maureldev constraints:**
- Drizzle ORM ready (existing schema structure, migrations working)
- Postgres 16 already in use (no new dependencies)
- Self-hosted scale (no need for TimescaleDB overhead)
- Next.js server-side queries (Drizzle integration seamless)
- GitHub OAuth data flow (backfill jobs fetch API, aggregate, upsert)

✅ **Respects YAGNI/KISS/DRY:**
- Single table structure (not normalized across 5 tables)
- Daily granularity only (no hourly premature optimization)
- No materialized views, continuous aggregates, or extensions
- Reuses existing Drizzle infrastructure

---

## Unresolved Questions

1. **GitHub API backfill scope:** Will you backfill 10 years of history on first sign-in or lazily on-demand? (Affects backfill job design, not schema.)
2. **Real-time event tracking:** If users can manually "log an activity," is that tracked as separate event rows, or only GitHub API data counts? (Affects whether raw `activity_events` table is needed.)
3. **Leaderboard/multi-user aggregation:** Future roadmap for "top contributors this month" dashboards? (Would justify Materialized View or TimescaleDB reconsideration.)
4. **Webhook vs. polling:** Will Dokploy run scheduled refresh jobs (polling), or will GitHub webhook push events? (Doesn't affect schema, but concurrency model.)

---

## Final Recommendation

**Implement:**
1. Create `user_activity_daily` table (Drizzle schema above)
2. Build backfill job using batch upsert pattern (500-row chunks)
3. Add composite BTREE index on (user_id, activity_date) as PRIMARY KEY
4. Query via Drizzle ORM with date-range filters (no date_trunc in WHERE)
5. Archive after 2+ years only if storage becomes issue (unlikely)

**Do NOT implement (until needed):**
- Raw event log table
- Hourly granularity
- Materialized views
- TimescaleDB extension
- BRIN indexes (standard BTREE sufficient for MVP scale)

**Estimated implementation time:** 4–6 hours (schema + migration + backfill job + tests).

---

**Report end.**
