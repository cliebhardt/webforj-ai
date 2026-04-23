#!/usr/bin/env node
// Syncs root plugin bundle inputs into plugins/<name>/ for Codex.
// Codex requires each plugin to live as a self-contained subdirectory,
// while Claude Code, Copilot CLI, and Gemini CLI read manifests from
// the repo root. Root stays the source of truth; this script copies.
//
// Usage: node scripts/sync.mjs

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, cpSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Each plugin we maintain a sync target for. Add new plugins here.
const plugins = [
  {
    name: "webforj",
    // Each [srcRelRoot, destRelPluginRoot] is a file or directory to mirror.
    mirror: [
      [".mcp.json",      ".mcp.json"],
      ["skills",         "skills"],
    ],
  },
];

for (const plugin of plugins) {
  const pluginRoot = join(ROOT, "plugins", plugin.name);
  mkdirSync(pluginRoot, { recursive: true });
  console.log(`sync  plugins/${plugin.name}/`);

  for (const [srcRel, destRel] of plugin.mirror) {
    const src = join(ROOT, srcRel);
    const dest = join(pluginRoot, destRel);
    if (!existsSync(src)) {
      console.warn(`  skip  ${srcRel} (missing)`);
      continue;
    }
    if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
    cpSync(src, dest, { recursive: true });
    console.log(`  copy  ${srcRel} -> plugins/${plugin.name}/${destRel}`);
  }
}

console.log("\nDone.");
