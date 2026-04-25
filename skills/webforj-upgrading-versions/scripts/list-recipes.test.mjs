// Tests for list-recipes.mjs. Stubs fetch so the suite stays offline.
//
// Run: node --test scripts/list-recipes.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { listRecipes } from "./list-recipes.mjs";

const apiUrl = "https://example.test/api";

function stubFetch(byUrl) {
  return async (url) => {
    if (!(url in byUrl)) throw new Error(`unexpected fetch: ${url}`);
    return {
      ok: true,
      json: async () => byUrl[url],
      text: async () => byUrl[url],
    };
  };
}

const v26 = `
name: com.webforj.rewrite.v26.UpgradeWebforj
name: com.webforj.rewrite.v26.UpgradeWebforjData
name: com.webforj.rewrite.v26.UpgradeWebforjTable
name: com.webforj.rewrite.v26.UpgradeWebforjSpring
`;
const v27 = `
name: com.webforj.rewrite.v27.UpgradeWebforj
name: com.webforj.rewrite.v27.UpgradeWebforjSpring
`;

test("filters umbrellas, sorts, dedupes, ignores non-yaml files", async () => {
  const fetchImpl = stubFetch({
    [apiUrl]: [
      { name: "README.md", download_url: "skip" },
      { name: "webforj-26.yml", download_url: "u26" },
      { name: "webforj-27.yml", download_url: "u27" },
      { name: "duplicate.yml", download_url: "u26" },
    ],
    u26: v26,
    u27: v27,
  });
  
  assert.deepEqual(await listRecipes({ apiUrl, fetchImpl }), [
    "com.webforj.rewrite.v26.UpgradeWebforj",
    "com.webforj.rewrite.v26.UpgradeWebforjSpring",
    "com.webforj.rewrite.v27.UpgradeWebforj",
    "com.webforj.rewrite.v27.UpgradeWebforjSpring",
  ]);
});

test("throws when no YAMLs are present", async () => {
  const fetchImpl = stubFetch({ [apiUrl]: [{ name: "README.md", download_url: "x" }] });
  await assert.rejects(
    () => listRecipes({ apiUrl, fetchImpl }),
    /no recipe YAMLs found/,
  );
});
