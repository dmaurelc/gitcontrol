import { test } from "node:test";
import assert from "node:assert/strict";
import { parseScopes, scopesInclude } from "./github-scopes.ts";

test("parseScopes splits comma-separated scopes", () => {
  assert.deepEqual(parseScopes("repo,read:org,user"), [
    "repo",
    "read:org",
    "user",
  ]);
});

test("parseScopes splits space-separated scopes and trims", () => {
  assert.deepEqual(parseScopes(" repo   read:org  user:email "), [
    "repo",
    "read:org",
    "user:email",
  ]);
});

test("parseScopes returns an empty array for missing input", () => {
  assert.deepEqual(parseScopes(null), []);
  assert.deepEqual(parseScopes(undefined), []);
  assert.deepEqual(parseScopes(""), []);
});

test("scopesInclude detects a granted scope", () => {
  assert.equal(scopesInclude("repo,user", "user"), true);
  assert.equal(scopesInclude("repo,user", "read:org"), false);
  assert.equal(scopesInclude(null, "user"), false);
});
