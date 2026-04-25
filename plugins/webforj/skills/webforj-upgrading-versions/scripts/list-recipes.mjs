#!/usr/bin/env node
// Enumerate user facing webforj-rewrite recipes from the upstream repo.
//
// Reads from the public GitHub anonymous API.
// Requires: Node 18+ (uses built-in fetch).
//
// Output: one recipe fully-qualified name per line, sorted, e.g.
//   com.webforj.rewrite.v26.UpgradeWebforj
//   com.webforj.rewrite.v26.UpgradeWebforjSpring
//
// Standard project recipes end in `UpgradeWebforj`.
// Spring Boot project recipes end in `UpgradeWebforjSpring`.

import { fileURLToPath } from "node:url";

const REPO = "webforj/webforj";
const DIR = "webforj-rewrite/src/main/resources/META-INF/rewrite";
const API_URL = `https://api.github.com/repos/${REPO}/contents/${DIR}`;

const UMBRELLA = /^name:\s*(com\.webforj\.rewrite\.v\d+\.UpgradeWebforj(?:Spring)?)\s*$/m;

async function defaultFetch(url) {
  const res = await fetch(url, { headers: { "User-Agent": "webforj-skill" } });
  if (!res.ok) throw new Error(`fetch ${url} failed: ${res.status} ${res.statusText}`);
  return res;
}

/**
 * @param {object} options
 * @param {string} [options.apiUrl]   The contents API URL to list YAMLs from.
 * @param {(url: string) => Promise<Response>} [options.fetchImpl]
 *        Override the network call. Used by tests.
 * 
 * @returns {Promise<string[]>} Sorted, deduped umbrella recipe names.
 */
export async function listRecipes({ apiUrl = API_URL, fetchImpl = defaultFetch } = {}) {
  const listing = await (await fetchImpl(apiUrl)).json();
  const yamls = listing
    .filter((f) => /\.(ya?ml)$/.test(f.name))
    .map((f) => f.download_url);

  if (yamls.length === 0) {
    throw new Error("no recipe YAMLs found in upstream repo");
  }

  const recipes = new Set();
  for (const url of yamls) {
    const body = await (await fetchImpl(url)).text();
    for (const line of body.split("\n")) {
      const m = line.match(UMBRELLA);
      if (m) recipes.add(m[1]);
    }
  }

  return [...recipes].sort();
}

// Run only when invoked as a script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const names = await listRecipes();
  for (const name of names) console.log(name);
}
