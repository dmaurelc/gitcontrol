import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aggregateActionsUsage,
  classifyBillingError,
  isActionsMinuteItem,
  osFromSku,
  round2,
  type BillingUsageItem,
} from "./actions-billing-parse.ts";

test("isActionsMinuteItem matches Actions minutes regardless of case", () => {
  assert.equal(
    isActionsMinuteItem({ product: "Actions", unitType: "minutes" }),
    true,
  );
  assert.equal(
    isActionsMinuteItem({ product: "actions", unitType: "Minutes" }),
    true,
  );
  assert.equal(
    isActionsMinuteItem({ product: "Packages", unitType: "Minutes" }),
    false,
  );
  assert.equal(
    isActionsMinuteItem({ product: "Actions", unitType: "GigabyteHours" }),
    false,
  );
  // Tolerant matching for unverified response shapes
  assert.equal(
    isActionsMinuteItem({ product: "GitHub Actions", unitType: "Minutes" }),
    true,
  );
  assert.equal(
    isActionsMinuteItem({ product: "Actions", unitType: "minute" }),
    true,
  );
  assert.equal(isActionsMinuteItem({ product: "Actions" }), true);
});

test("osFromSku maps known runners and falls back to the raw sku", () => {
  assert.equal(osFromSku("Actions Linux"), "Linux");
  assert.equal(osFromSku("Actions Windows"), "Windows");
  assert.equal(osFromSku("Actions macOS"), "macOS");
  assert.equal(osFromSku("Actions Linux ARM"), "Linux");
  assert.equal(osFromSku("Actions Storage"), "Storage");
  assert.equal(osFromSku("Actions Custom"), "Actions Custom");
  assert.equal(osFromSku(undefined), "Other");
});

test("aggregateActionsUsage filters, sums, groups and sorts", () => {
  const items: BillingUsageItem[] = [
    { product: "Actions", unitType: "minutes", sku: "Actions Linux", quantity: 100, netAmount: 0.8, date: "2026-09-02", repositoryName: "api" },
    { product: "Actions", unitType: "Minutes", sku: "Actions Windows", quantity: 50, netAmount: 0.5, date: "2026-09-01", repositoryName: "api" },
    { product: "Actions", unitType: "minutes", sku: "Actions Linux", quantity: 25, netAmount: 0.2, date: "2026-09-01", repositoryName: "web" },
    // Ignored: not Actions
    { product: "Packages", unitType: "Minutes", sku: "Packages Storage", quantity: 999, netAmount: 9, date: "2026-09-01", repositoryName: "api" },
    // Ignored: not minutes
    { product: "Actions", unitType: "GigabyteHours", sku: "Actions Storage", quantity: 5, netAmount: 1, date: "2026-09-01", repositoryName: "api" },
  ];

  const agg = aggregateActionsUsage(items);

  assert.equal(agg.usedMinutes, 175);
  assert.equal(agg.netAmount, 1.5);

  assert.deepEqual(
    agg.byOs.map((o) => [o.os, o.minutes]),
    [
      ["Linux", 125],
      ["Windows", 50],
    ],
  );

  assert.deepEqual(
    agg.byRepo.map((r) => [r.repo, r.minutes]),
    [
      ["api", 150],
      ["web", 25],
    ],
  );

  // byDay is sorted ascending
  assert.deepEqual(
    agg.byDay.map((d) => [d.date, d.minutes]),
    [
      ["2026-09-01", 75],
      ["2026-09-02", 100],
    ],
  );
});

test("aggregateActionsUsage handles empty input", () => {
  const agg = aggregateActionsUsage([]);
  assert.deepEqual(agg, {
    usedMinutes: 0,
    netAmount: 0,
    byOs: [],
    byRepo: [],
    byDay: [],
  });
});

test("aggregateActionsUsage rounds floating point noise", () => {
  const agg = aggregateActionsUsage([
    { product: "Actions", unitType: "minutes", sku: "Actions Linux", quantity: 0.1, netAmount: 0.1, date: "2026-09-01", repositoryName: "a" },
    { product: "Actions", unitType: "minutes", sku: "Actions Linux", quantity: 0.2, netAmount: 0.2, date: "2026-09-01", repositoryName: "a" },
  ]);
  assert.equal(agg.usedMinutes, 0.3);
  assert.equal(agg.netAmount, 0.3);
});

test("round2 rounds to two decimals", () => {
  assert.equal(round2(1.005), 1.01);
  assert.equal(round2(1.004), 1);
});

test("classifyBillingError maps status codes to UI states", () => {
  assert.equal(classifyBillingError({ status: 401 }, "user"), "missing_scope");
  assert.equal(classifyBillingError({ status: 403 }, "user"), "missing_scope");
  assert.equal(classifyBillingError({ status: 403 }, "org"), "forbidden_org");
  assert.equal(classifyBillingError({ status: 404 }, "org"), "unavailable");
  assert.equal(classifyBillingError({ status: 500 }, "user"), "unavailable");
  assert.equal(classifyBillingError(new Error("boom"), "user"), "unavailable");
});
