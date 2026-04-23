#!/usr/bin/env node
// Bumps the plugin version across every manifest in one shot.
// Usage: node scripts/bump.mjs <new-version>
// Example: node scripts/bump.mjs 0.2.0

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

const newVersion = process.argv[2];
if (!newVersion) {
  console.error("Usage: node scripts/bump.mjs <new-version>");
  process.exit(1);
}
if (!SEMVER.test(newVersion)) {
  console.error(`Not a valid semver: "${newVersion}"`);
  process.exit(1);
}

// Each entry: [relativeFile, [...jsonPaths]] — every path is a dotted json field to set to newVersion.
const targets = [
  [".claude-plugin/plugin.json",                      ["version"]],
  [".claude-plugin/marketplace.json",                 ["metadata.version", "plugins.0.version"]],
  [".github/plugin/plugin.json",                      ["version"]],
  ["plugins/webforj/.codex-plugin/plugin.json",       ["version"]],
  ["gemini-extension.json",                           ["version"]],
  ["server.json",                                     ["version"]],
];

function setDottedPath(obj, path, value) {
  const parts = path.split(".");
  let node = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const next = /^\d+$/.test(parts[i + 1]) ? [] : {};
    node[key] ??= next;
    node = node[key];
  }
  node[parts.at(-1)] = value;
}

for (const [relPath, paths] of targets) {
  const abs = join(ROOT, relPath);
  if (!existsSync(abs)) {
    console.warn(`skip  ${relPath} (missing)`);
    continue;
  }
  const raw = readFileSync(abs, "utf8");
  const data = JSON.parse(raw);
  for (const p of paths) setDottedPath(data, p, newVersion);
  writeFileSync(abs, JSON.stringify(data, null, 2) + "\n");
  console.log(`bump  ${relPath} (${paths.join(", ")})`);
}

console.log(`\nAll root manifests bumped to ${newVersion}. Syncing subdirectories...`);

// Propagate root changes into plugins/<name>/ (Codex subdirectory requirement).
execSync(`node "${join(__dirname, "sync.mjs")}"`, { cwd: ROOT, stdio: "inherit" });
