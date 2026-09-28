import { test } from "node:test";
import assert from "node:assert/strict";
import { includedMinutesForPlan } from "./actions-included-minutes.ts";

test("maps known plan names to included minutes", () => {
  assert.equal(includedMinutesForPlan("free"), 2000);
  assert.equal(includedMinutesForPlan("pro"), 3000);
  assert.equal(includedMinutesForPlan("team"), 3000);
  assert.equal(includedMinutesForPlan("business"), 3000);
  assert.equal(includedMinutesForPlan("enterprise"), 50000);
});

test("is case- and whitespace-insensitive", () => {
  assert.equal(includedMinutesForPlan("  Pro "), 3000);
  assert.equal(includedMinutesForPlan("ENTERPRISE"), 50000);
});

test("returns null for unknown or missing plans", () => {
  assert.equal(includedMinutesForPlan(null), null);
  assert.equal(includedMinutesForPlan(undefined), null);
  assert.equal(includedMinutesForPlan(""), null);
  assert.equal(includedMinutesForPlan("mystery-plan"), null);
});
