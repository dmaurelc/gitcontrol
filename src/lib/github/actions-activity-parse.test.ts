import { test } from "node:test";
import assert from "node:assert/strict";
import {
  collectFailedRuns,
  durationSeconds,
  isFailureConclusion,
  summarizeRepoRuns,
  summarizeWorkflows,
  type RunLike,
} from "./actions-activity-parse.ts";

const run = (over: Partial<RunLike>): RunLike => ({
  id: 1,
  name: "CI",
  display_title: "Build",
  run_number: 10,
  status: "completed",
  conclusion: "success",
  created_at: "2026-09-01T10:00:00Z",
  run_started_at: "2026-09-01T10:00:00Z",
  updated_at: "2026-09-01T10:02:00Z",
  html_url: "https://github.com/o/r/actions/runs/1",
  ...over,
});

test("isFailureConclusion recognizes failure-like conclusions", () => {
  assert.equal(isFailureConclusion("failure"), true);
  assert.equal(isFailureConclusion("TIMED_OUT"), true);
  assert.equal(isFailureConclusion("action_required"), true);
  assert.equal(isFailureConclusion("success"), false);
  assert.equal(isFailureConclusion(null), false);
});

test("durationSeconds prefers run_started_at and falls back to created_at", () => {
  assert.equal(durationSeconds(run({})), 120);
  assert.equal(
    durationSeconds(
      run({
        run_started_at: null,
        created_at: "2026-09-01T10:00:00Z",
        updated_at: "2026-09-01T10:05:00Z",
      }),
    ),
    300,
  );
});

test("durationSeconds returns null for missing or negative deltas", () => {
  assert.equal(durationSeconds(run({ updated_at: null })), null);
  assert.equal(
    durationSeconds(
      run({ run_started_at: "2026-09-01T11:00:00Z", updated_at: "2026-09-01T10:00:00Z" }),
    ),
    null,
  );
});

test("summarizeRepoRuns computes counts, success rate and average duration", () => {
  const runs: RunLike[] = [
    run({ id: 1, conclusion: "success", updated_at: "2026-09-01T10:02:00Z" }),
    run({ id: 2, conclusion: "success", updated_at: "2026-09-01T10:04:00Z" }),
    run({ id: 3, conclusion: "failure", updated_at: "2026-09-01T10:01:00Z" }),
    run({ id: 4, conclusion: "cancelled", updated_at: "2026-09-01T10:00:30Z" }),
    run({ id: 5, conclusion: null, status: "in_progress", updated_at: "2026-09-01T10:00:10Z" }),
  ];
  const stat = summarizeRepoRuns("octo", "repo", runs, { truncated: true });

  assert.equal(stat.repo, "octo/repo");
  assert.equal(stat.runs, 5);
  assert.equal(stat.success, 2);
  assert.equal(stat.failure, 1);
  assert.equal(stat.successRate, 2 / 3);
  // (120 + 240 + 60 + 30) / 4 = 112.5 → 113 (in_progress run excluded)
  assert.equal(stat.avgDurationSeconds, 113);
  assert.equal(stat.truncated, true);
});

test("summarizeRepoRuns yields null success rate when nothing concluded", () => {
  const stat = summarizeRepoRuns("o", "r", [
    run({ conclusion: null, status: "queued", run_started_at: null }),
  ]);
  assert.equal(stat.successRate, null);
  assert.equal(stat.avgDurationSeconds, null);
});

test("summarizeWorkflows groups by workflow name and sorts by runs", () => {
  const runs: RunLike[] = [
    run({ name: "CI", conclusion: "failure" }),
    run({ name: "CI", conclusion: "success" }),
    run({ name: "Deploy", conclusion: "success" }),
    run({ name: null }),
  ];
  const workflows = summarizeWorkflows("o/r", runs);
  assert.equal(workflows.length, 3);
  assert.equal(workflows[0].workflow, "CI");
  assert.equal(workflows[0].runs, 2);
  assert.equal(workflows[0].failures, 1);
  const unknown = workflows.find((w) => w.workflow === "Unknown workflow");
  assert.ok(unknown);
});

test("collectFailedRuns filters, sorts by recency and limits", () => {
  const runs: RunLike[] = [
    run({ id: 1, conclusion: "failure", updated_at: "2026-09-01T10:00:00Z" }),
    run({ id: 2, conclusion: "success", updated_at: "2026-09-02T10:00:00Z" }),
    run({ id: 3, conclusion: "timed_out", updated_at: "2026-09-03T10:00:00Z" }),
    run({ id: 4, conclusion: "failure", updated_at: "2026-09-04T10:00:00Z" }),
  ];
  const failed = collectFailedRuns("o/r", runs, 2);
  assert.equal(failed.length, 2);
  assert.deepEqual(
    failed.map((f) => f.id),
    [4, 3],
  );
  assert.equal(failed[0].conclusion, "failure");
});
