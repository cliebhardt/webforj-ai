#!/usr/bin/env node

import { execFileSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(__dirname, "component-styles.mjs");

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

console.log("component-styles.mjs tests\n");

test("shows usage with no arguments", () => {
  const { code, out } = run([]);
  assert(code === 1, `expected exit 1, got ${code}`);
  assert(out.includes("Usage"), "should show usage text");
});

test("--list returns component tags", () => {
  const { code, out } = run(["--list"]);
  assert(code === 0, `expected exit 0, got ${code}`);
  assert(out.includes("dwc-button"), "should include dwc-button");
  assert(out.includes("dwc-dialog"), "should include dwc-dialog");
  assert(out.includes("Available components"), "should show count header");
});

test("--map returns Java to DWC mappings", () => {
  const { code, out } = run(["--map"]);
  assert(code === 0, `expected exit 0, got ${code}`);
  assert(out.includes("Button"), "should include Button mapping");
  assert(out.includes("dwc-button"), "should map to dwc-button");
  assert(out.includes("mappings"), "should show count header");
});

test("resolves Java class name to DWC tag", () => {
  const { code, out } = run(["Button"]);
  assert(code === 0, `expected exit 0, got ${code}`);
  assert(out.includes("dwc-button"), "should resolve to dwc-button");
  assert(out.includes("resolved from Button"), "should show resolution");
});

test("resolves Java class name case-insensitively", () => {
  const { code, out } = run(["button"]);
  assert(code === 0, `expected exit 0, got ${code}`);
  assert(out.includes("dwc-button"), "should resolve to dwc-button");
});

test("accepts DWC tag directly", () => {
  const { code, out } = run(["dwc-button"]);
  assert(code === 0, `expected exit 0, got ${code}`);
  assert(out.includes("# dwc-button"), "should show tag header");
  assert(!out.includes("resolved from"), "should not show resolution for exact match");
});

test("shows shadow parts for button", () => {
  const { code, out } = run(["dwc-button"]);
  assert(code === 0, `expected exit 0, got ${code}`);
  assert(out.includes("## Shadow Parts"), "should have shadow parts section");
  assert(out.includes("control"), "should list control part");
  assert(out.includes("label"), "should list label part");
});

test("shows reflected attributes", () => {
  const { code, out } = run(["dwc-button"]);
  assert(code === 0, `expected exit 0, got ${code}`);
  assert(out.includes("## Reflected Attributes"), "should have reflected attrs section");
  assert(out.includes("theme"), "should list theme attribute");
  assert(out.includes("expanse"), "should list expanse attribute");
  assert(out.includes("disabled"), "should list disabled attribute");
});

test("shows slots", () => {
  const { code, out } = run(["dwc-button"]);
  assert(code === 0, `expected exit 0, got ${code}`);
  assert(out.includes("## Slots"), "should have slots section");
  assert(out.includes("(default)"), "should list default slot");
});

test("shows encapsulation type", () => {
  const { code, out } = run(["dwc-button"]);
  assert(code === 0, `expected exit 0, got ${code}`);
  assert(out.includes("encapsulation: shadow"), "should show shadow encapsulation");
});

test("exits with error for unknown component", () => {
  const { code, out } = run(["FakeComponent"]);
  assert(code === 1, `expected exit 1, got ${code}`);
  assert(out.includes("not found"), "should show error message");
});

test("shows CSS custom properties when they exist", () => {
  const { code, out } = run(["dwc-field"]);
  assert(code === 0, `expected exit 0, got ${code}`);
  assert(out.includes("## CSS Custom Properties"), "should have CSS props section");
});

test("resolves TextField to dwc-textfield", () => {
  const { code, out } = run(["TextField"]);
  assert(code === 0, `expected exit 0, got ${code}`);
  assert(out.includes("dwc-textfield"), "should resolve to dwc-textfield");
});

test("resolves Dialog to dwc-dialog", () => {
  const { code, out } = run(["Dialog"]);
  assert(code === 0, `expected exit 0, got ${code}`);
  assert(out.includes("dwc-dialog"), "should resolve to dwc-dialog");
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
