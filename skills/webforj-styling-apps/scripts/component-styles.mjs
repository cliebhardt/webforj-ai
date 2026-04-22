#!/usr/bin/env node

/**
 * Fetch CSS styling data for a DWC web component.
 *
 * Usage:
 *   node component-styles.mjs <name>       # Java class or DWC tag name
 *   node component-styles.mjs --list       # all valid DWC tag names
 *   node component-styles.mjs --map        # Java class -> DWC tag mapping
 *
 * Accepts either a DWC tag (dwc-button) or a Java class name (Button, TextField).
 * Java names are resolved automatically via the webforJ control map.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const COMPONENTS_URL = "https://dwc.style/docs/dwc-components.json";
const MAP_URL =
  "https://raw.githubusercontent.com/webforj/webforj-documentation/main/docs/docs/components/_dwc_control_map.json";
const CACHE_DIR = join(tmpdir(), "dwc-component-styles");
const CACHE_MAX_AGE = 86400 * 1000; // 24 hours in ms

async function cachedFetch(url, filename) {
  const path = join(CACHE_DIR, filename);
  if (existsSync(path)) {
    const age = Date.now() - statSync(path).mtimeMs;
    if (age < CACHE_MAX_AGE) {
      return JSON.parse(readFileSync(path, "utf-8"));
    }
  }

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
  }
  const data = await resp.json();

  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(path, JSON.stringify(data));
  return data;
}

async function fetchComponents() {
  const data = await cachedFetch(COMPONENTS_URL, "dwc-components.json");
  return data.components;
}

async function fetchMap() {
  return cachedFetch(MAP_URL, "dwc-control-map.json");
}

function resolveTag(name, controlMap, tags) {
  if (tags.has(name)) return name;
  for (const [javaName, dwcTag] of Object.entries(controlMap)) {
    if (javaName.toLowerCase() === name.toLowerCase()) return dwcTag;
  }
  return null;
}

function extractStyling(comp) {
  const tag = comp.tag;

  const styles = comp.styles || [];
  const cssProps = styles.map((s) => [s.name, s.docs || ""]);

  const docTags = comp.docsTags || [];
  const parts = [];
  for (const dt of docTags) {
    if (dt.name === "part") {
      const text = dt.text || "";
      if (text.includes(" - ")) {
        const [pname, ...rest] = text.split(" - ");
        parts.push([pname.trim(), rest.join(" - ").trim()]);
      } else {
        parts.push([text.trim(), ""]);
      }
    }
  }

  const slotsRaw = comp.slots || [];
  const slots = slotsRaw.map((s) => [s.name || "(default)", s.docs || ""]);

  const props = comp.props || [];
  const reflected = [];
  for (const p of props) {
    if (p.reflectToAttr) {
      const attr = p.attr || p.name;
      if (attr) reflected.push([attr, p.docs || ""]);
    }
  }

  return { tag, cssProps, parts, slots, reflected };
}

function printTable(headerA, headerB, rows) {
  if (!rows.length) {
    console.log("  (none)");
    return;
  }
  const colA = Math.max(headerA.length, ...rows.map((r) => r[0].length)) + 2;
  console.log(`  ${headerA.padEnd(colA)} ${headerB}`);
  console.log(`  ${"-".repeat(colA)} ${"-".repeat(40)}`);
  for (const [name, desc] of rows) {
    console.log(`  ${name.padEnd(colA)} ${desc}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.log(
      "Usage:\n" +
        "  node component-styles.mjs <name>   # Java class or DWC tag\n" +
        "  node component-styles.mjs --list   # all valid DWC tags\n" +
        "  node component-styles.mjs --map    # Java -> DWC mappings"
    );
    process.exit(1);
  }

  const arg = args[0];

  if (arg === "--map") {
    const controlMap = await fetchMap();
    const entries = Object.entries(controlMap).sort(([a], [b]) => a.localeCompare(b));
    const col = Math.max(...entries.map(([k]) => k.length)) + 2;
    console.log(`Java class -> DWC tag (${entries.length} mappings):\n`);
    for (const [javaName, dwcTag] of entries) {
      console.log(`  ${javaName.padEnd(col)} ${dwcTag}`);
    }
    return;
  }

  const components = await fetchComponents();
  const tags = new Set(components.map((c) => c.tag));

  if (arg === "--list") {
    const sorted = [...tags].sort();
    console.log(`Available components (${sorted.length}):\n`);
    for (const t of sorted) {
      console.log(`  ${t}`);
    }
    return;
  }

  const controlMap = await fetchMap();
  const tag = resolveTag(arg.trim(), controlMap, tags);

  if (!tag) {
    console.error(`Error: '${arg}' not found as a DWC tag or Java class name.\n`);
    console.error("Run with --list to see all valid DWC tags.");
    console.error("Run with --map to see Java class -> DWC tag mappings.");
    process.exit(1);
  }

  const comp = components.find((c) => c.tag === tag);
  const { cssProps, parts, slots, reflected } = extractStyling(comp);

  if (arg.trim() !== tag) {
    console.log(`# ${tag}  (resolved from ${arg.trim()})`);
  } else {
    console.log(`# ${tag}`);
  }
  console.log(`  encapsulation: ${comp.encapsulation || "unknown"}`);
  console.log();

  console.log("## CSS Custom Properties");
  printTable("Property", "Description", cssProps);
  console.log();

  console.log("## Shadow Parts");
  printTable("Part", "Description", parts);
  console.log();

  console.log("## Reflected Attributes (usable as CSS selectors)");
  printTable("Attribute", "Description", reflected);
  console.log();

  console.log("## Slots");
  printTable("Slot", "Description", slots);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(2);
});
