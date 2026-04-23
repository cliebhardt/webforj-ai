#!/usr/bin/env node

/**
 * Validates that all --dwc-* CSS variable references in files are real DWC tokens.
 *
 * Usage:
 *   node validate-tokens.mjs <file-or-directory>
 *
 * Checks CSS, Java, MDX, and MD files for --dwc-* var references.
 * Validates against:
 *   1. Global tokens (scraped from live DWC instance)
 *   2. Component CSS vars (from dwc-components.json API)
 *
 * Exit code: 0 = all valid, 1 = invalid tokens found, 2 = bad usage
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from "fs";
import { join, extname, relative, dirname } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_FILE = join(__dirname, "..", "references", "dwc-tokens.json");
const COMPONENTS_URL = "https://dwc.style/docs/dwc-components.json";
const CACHE_DIR = join(tmpdir(), "dwc-component-styles");
const CACHE_MAX_AGE = 86400 * 1000;

const EXTENSIONS = new Set([".css", ".java", ".md", ".mdx", ".scss"]);

// Match --dwc-* in var() references, property declarations, and string literals
const DWC_VAR_RE = /--dwc-[a-zA-Z0-9-]+/g;

async function cachedFetch(url, filename) {
  const path = join(CACHE_DIR, filename);
  if (existsSync(path)) {
    const age = Date.now() - statSync(path).mtimeMs;
    if (age < CACHE_MAX_AGE) {
      return JSON.parse(readFileSync(path, "utf-8"));
    }
  }
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`);
  const data = await resp.json();
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(path, JSON.stringify(data));
  return data;
}

function loadGlobalTokens() {
  if (!existsSync(TOKENS_FILE)) {
    console.error(`Token list not found at ${TOKENS_FILE}`);
    process.exit(2);
  }
  return new Set(JSON.parse(readFileSync(TOKENS_FILE, "utf-8")));
}

async function loadComponentVars() {
  try {
    const data = await cachedFetch(COMPONENTS_URL, "dwc-components.json");
    const vars = new Set();
    for (const comp of data.components) {
      for (const style of comp.styles || []) {
        vars.add(style.name);
      }
    }
    return vars;
  } catch (e) {
    console.error(`Warning: could not fetch component vars: ${e.message}`);
    return new Set();
  }
}

function collectFiles(target) {
  const stat = statSync(target);
  if (stat.isFile()) return EXTENSIONS.has(extname(target)) ? [target] : [];
  const files = [];
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = join(target, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(full));
    } else if (EXTENSIONS.has(extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

function charOffsetToLine(content, offset) {
  let line = 1;
  for (let i = 0; i < offset && i < content.length; i++) {
    if (content[i] === "\n") line++;
  }
  return line;
}

function validateFile(filePath, basePath, validTokens) {
  const content = readFileSync(filePath, "utf-8");
  const displayPath = basePath ? relative(basePath, filePath) : filePath;
  const issues = [];

  let match;
  DWC_VAR_RE.lastIndex = 0;
  while ((match = DWC_VAR_RE.exec(content)) !== null) {
    const token = match[0];
    if (!validTokens.has(token)) {
      const line = charOffsetToLine(content, match.index);
      issues.push({ file: displayPath, line, token });
    }
  }
  return issues;
}

async function main() {
  const args = process.argv.slice(2);

  if (!args.length) {
    console.log("Usage: node validate-tokens.mjs <file-or-directory>");
    process.exit(2);
  }

  const target = args[0];
  if (!existsSync(target)) {
    console.error(`Error: '${target}' does not exist`);
    process.exit(2);
  }

  // Load both token sources
  const globalTokens = loadGlobalTokens();
  const componentVars = await loadComponentVars();
  const validTokens = new Set([...globalTokens, ...componentVars]);

  const files = collectFiles(target);
  if (!files.length) {
    console.log("No matching files found.");
    return;
  }

  const basePath = statSync(target).isDirectory() ? target : null;
  let allIssues = [];

  for (const file of files) {
    const issues = validateFile(file, basePath, validTokens);
    allIssues.push(...issues);
  }

  if (!allIssues.length) {
    console.log(`All --dwc-* tokens valid across ${files.length} file(s).`);
    process.exit(0);
  }

  // Group by file
  const byFile = new Map();
  for (const issue of allIssues) {
    if (!byFile.has(issue.file)) byFile.set(issue.file, []);
    byFile.get(issue.file).push(issue);
  }

  for (const [file, issues] of byFile) {
    console.log(file);
    for (const { line, token } of issues) {
      console.log(`  line ${line}: invalid token "${token}"`);
    }
    console.log();
  }

  // Deduplicate tokens for summary
  const uniqueInvalid = [...new Set(allIssues.map((i) => i.token))].sort();
  console.log(`${allIssues.length} invalid token(s) across ${byFile.size} file(s)`);
  console.log(`Unique invalid tokens: ${uniqueInvalid.join(", ")}`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(2);
});
