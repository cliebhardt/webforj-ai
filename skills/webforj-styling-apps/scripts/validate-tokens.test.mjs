#!/usr/bin/env node

import { execFileSync } from "child_process";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(__dirname, "validate-tokens.mjs");
const TMP = join(tmpdir(), "validate-tokens-test-" + Date.now());

let passed = 0;
let failed = 0;

function run(args) {
  try {
    const out = execFileSync("node", [SCRIPT, ...args], {
      encoding: "utf-8",
      timeout: 30000,
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

function test(name, fn) {
  try {
    fn();
    console.log(`  pass: ${name}`);
    passed++;
  } catch (e) {
    console.log(`  FAIL: ${name}`);
    console.log(`        ${e.message}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// Setup temp files
mkdirSync(TMP, { recursive: true });

writeFileSync(join(TMP, "valid.css"), `
:root {
  --dwc-color-primary-h: 220;
  --dwc-color-primary-s: 75%;
}
dwc-button:not([theme]) {
  background: var(--dwc-surface-3);
  padding: var(--dwc-space-m);
  font-size: var(--dwc-font-size-m);
}
`);

writeFileSync(join(TMP, "invalid.css"), `
:root {
  --dwc-color-accent-h: 220;
}
.card {
  background: var(--dwc-color-neutral-50);
  padding: var(--dwc-space-m);
  color: var(--dwc-color-secondary);
}
`);

writeFileSync(join(TMP, "valid.java"), `
@InlineStyleSheet("dwc-button { background: var(--dwc-color-primary); }")
public class MyView { }
`);

writeFileSync(join(TMP, "invalid.java"), `
element.setStyle("background", "var(--dwc-color-fake-token)");
element.setStyle("color", "var(--dwc-toolbar-magic)");
`);

writeFileSync(join(TMP, "skip.txt"), `This --dwc-fake-thing should be skipped (wrong extension)`);

console.log("validate-tokens.mjs tests\n");

test("shows usage with no arguments", () => {
  const { code } = run([]);
  assert(code === 2, `expected exit 2, got ${code}`);
});

test("exits 0 for valid CSS tokens", () => {
  const { code, out } = run([join(TMP, "valid.css")]);
  assert(code === 0, `expected exit 0, got ${code}`);
  assert(out.includes("All --dwc-* tokens valid"), "should confirm all valid");
});

test("exits 1 for invalid CSS tokens", () => {
  const { code, out } = run([join(TMP, "invalid.css")]);
  assert(code === 1, `expected exit 1, got ${code}`);
  assert(out.includes("--dwc-color-neutral-50"), "should flag neutral");
  assert(out.includes("--dwc-color-secondary"), "should flag secondary");
  assert(out.includes("--dwc-color-accent-h"), "should flag accent");
});

test("does not flag valid tokens mixed with invalid", () => {
  const { code, out } = run([join(TMP, "invalid.css")]);
  assert(!out.includes("--dwc-space-m"), "should not flag valid --dwc-space-m");
});

test("validates Java files", () => {
  const { code, out } = run([join(TMP, "invalid.java")]);
  assert(code === 1, `expected exit 1, got ${code}`);
  assert(out.includes("--dwc-color-fake-token"), "should flag fake token in Java");
  assert(out.includes("--dwc-toolbar-magic"), "should flag made-up component var");
});

test("exits 0 for valid Java tokens", () => {
  const { code } = run([join(TMP, "valid.java")]);
  assert(code === 0, `expected exit 0, got ${code}`);
});

test("skips non-matching file extensions", () => {
  const { code, out } = run([join(TMP, "skip.txt")]);
  assert(code === 0, `expected exit 0, got ${code}`);
  assert(out.includes("No matching files"), "should skip .txt");
});

test("scans directory recursively", () => {
  const { code, out } = run([TMP]);
  assert(code === 1, `expected exit 1 (invalid files in dir), got ${code}`);
  assert(out.includes("invalid token"), "should find invalid tokens in dir scan");
});

test("shows line numbers", () => {
  const { code, out } = run([join(TMP, "invalid.css")]);
  assert(out.includes("line "), "should show line numbers");
});

test("shows unique invalid tokens summary", () => {
  const { code, out } = run([join(TMP, "invalid.css")]);
  assert(out.includes("Unique invalid tokens:"), "should show summary");
});

// Cleanup
rmSync(TMP, { recursive: true });

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
