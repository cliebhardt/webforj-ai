#!/usr/bin/env node

/**
 * Parses a Custom Elements Manifest (CEM) and outputs universal component spec JSON.
 * Run with --help for usage.
 *
 * @author Hyyan Abo Fakher
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  getAllComponents as cemGetAllComponents,
  getComponentPublicProperties,
  getComponentPublicMethods,
  getComponentEventsWithType,
  getAttrsAndProps,
  toPascalCase,
} from "@wc-toolkit/cem-utilities";

const { values: args } = parseArgs({
  options: {
    file: { type: "string" },
    tag: { type: "string" },
    list: { type: "boolean", default: false },
    outdir: { type: "string" },
    format: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

/**
 * Extracts string enum values from a type like "'primary' | 'success' | 'danger'".
 * Returns null if the type is not a string union.
 */
export function extractEnumValues(typeText) {
  if (!typeText) return null;
  const matches = typeText.match(/'([^']+)'/g);
  if (!matches || matches.length < 2) return null;
  return matches.map((m) => m.replace(/'/g, ""));
}

/**
 * Builds a universal component spec from a CEM component declaration.
 * Uses cem-utilities for property, method, event, and attribute extraction.
 */
export function buildComponentSpec(component) {
  const tag = component.tagName;

  const attrsAndProps = getAttrsAndProps(component);
  const publicProps = getComponentPublicProperties(component);

  const properties = publicProps.map((prop) => {
    const typeText = prop.type?.text || "string";
    const values = extractEnumValues(typeText);
    const attrEntry = attrsAndProps.find((ap) => ap.propName === prop.name);
    const spec = {
      name: prop.name,
      type: values ? "string" : typeText.replace(/\s/g, ""),
      description: prop.description || "",
    };
    if (prop.default) spec.default = prop.default;
    if (attrEntry?.attrName) spec.attribute = attrEntry.attrName;
    if (values) spec.values = values;
    return spec;
  });

  const rawEvents = getComponentEventsWithType(component);
  const events = rawEvents.map((evt) => ({
    name: evt.name,
    type: evt.type?.text || "CustomEvent",
    detail: evt.type?.text?.includes("<") ? evt.type.text : null,
    description: evt.description || "",
  }));

  const slots = (component.slots || []).map((slot) => ({
    name: slot.name || "",
    description: slot.description || "",
  }));

  const cssProperties = (component.cssProperties || []).map((cp) => {
    const spec = { name: cp.name, description: cp.description || "" };
    if (cp.default) spec.default = cp.default;
    return spec;
  });

  const cssParts = (component.cssParts || []).map((cp) => ({
    name: cp.name,
    description: cp.description || "",
  }));

  const publicMethods = getComponentPublicMethods(component);
  const methods = publicMethods.map((m) => ({
    name: m.name,
    params: (m.parameters || []).map((p) => ({
      name: p.name,
      type: p.type?.text || "any",
    })),
    return: m.return?.type?.text || "void",
    description: m.description || "",
  }));

  return {
    tag,
    className: toPascalCase(tag),
    description: component.description || "",
    properties,
    events,
    slots,
    cssProperties,
    cssParts,
    methods,
  };
}

/**
 * Real spec format from Shoelace sl-dialog — loaded from spec-format.json.
 * Generated via: node extract_components.mjs --file .../shoelace/dist/custom-elements.json --tag sl-dialog
 */
const __scriptDir = dirname(fileURLToPath(import.meta.url));
export const SPEC_FORMAT = JSON.parse(
  readFileSync(resolve(__scriptDir, "spec-format.json"), "utf-8")
);

/**
 * Main entry point.
 */
function main() {
  if (args.format) {
    console.log(JSON.stringify(SPEC_FORMAT, null, 2));
    process.exit(0);
  }

  if (args.help || !args.file) {
    console.log(`Usage: node extract_components.mjs --file <cem.json> [options]

Options:
  --file <path>    Path to custom-elements.json (required)
  --list           List all component tag names
  --tag <name>     Extract a single component by tag name
  --outdir <path>  Write individual JSON files to directory
  --format         Show the universal spec JSON format
  -h, --help       Show this help

Without --list, --tag, or --outdir, outputs all components as JSON to stdout.`);
    process.exit(args.help ? 0 : 1);
  }

  const raw = readFileSync(resolve(args.file), "utf-8");
  const manifest = JSON.parse(raw);
  const allComponents = cemGetAllComponents(manifest);

  if (args.list) {
    const tags = allComponents.map((c) => c.tagName).sort();
    console.log(tags.join("\n"));
    return;
  }

  let components = allComponents;
  if (args.tag) {
    components = allComponents.filter((c) => c.tagName === args.tag);
    if (components.length === 0) {
      console.error(`No component found with tag "${args.tag}"`);
      process.exit(1);
    }
  }

  const specs = components.map((c) => buildComponentSpec(c));

  if (args.outdir) {
    mkdirSync(args.outdir, { recursive: true });
    for (const spec of specs) {
      const outPath = join(args.outdir, `${spec.tag}.json`);
      writeFileSync(outPath, JSON.stringify(spec, null, 2) + "\n");
      console.log(`Wrote ${outPath}`);
    }
  } else if (specs.length === 1) {
    console.log(JSON.stringify(specs[0], null, 2));
  } else {
    console.log(JSON.stringify(specs, null, 2));
  }
}

// Only run main() when executed directly, not when imported
const isMain = process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/.*\//, ""));
if (isMain) {
  main();
}
