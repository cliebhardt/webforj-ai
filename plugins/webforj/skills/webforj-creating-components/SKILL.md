---
name: webforj-creating-components
description: "Creates reusable webforJ components from core components, third-party web component libraries, or plain JavaScript libraries. Covers ElementComposite wrappers with PropertyDescriptor and EventName, component extensions with onDidCreate and executeJs, and page-level utilities with EventDispatcher. Use when asked to create, wrap, integrate, or build any custom component in a webforJ project."
---

# Creating Components in webforJ

Build reusable Java components from any source — Custom Elements, plain JS
libraries, or browser APIs — with type-safe properties, structured events,
and clean APIs.

## Choose Your Approach

There are five paths to creating a reusable webforJ component.

| Path | When to use | Java side | Reference |
|---|---|---|---|
| **A. Wrap existing CE library** | Library ships Custom Elements | `ElementComposite` / `ElementCompositeContainer` | [element-composite.md](references/element-composite.md) |
| **B. Build a Custom Element + wrap** | New visual component, or wrapping a plain JS library | `ElementComposite` / `ElementCompositeContainer` | [extending-components.md](references/extending-components.md) |
| **C. Compose webforJ components** | Combining existing webforJ components into a reusable unit | `Composite<T>` + concern interfaces | [composition.md](references/composition.md) |
| **D. Extend an HTML element** | Trivial one-off integration, no Shadow DOM needed | Extend `Div`, `Span`, etc. | [extending-components.md](references/extending-components.md) |
| **E. Page-level utility** | Browser API or global feature with no DOM widget | Plain Java class + `EventDispatcher` | [extending-components.md](references/extending-components.md) |

### Path A — Wrap an existing Custom Element library

The library already provides `<x-button>`, `<x-dialog>`, etc. Jump straight
to the [Custom Element Workflow](#custom-element-workflow) below.

### Path B — Build a Custom Element, then wrap it (preferred for new JS components)

When no existing Custom Element fits your need, **write one in vanilla JS**
first, then wrap it with `ElementComposite` — exactly the same Java-side
pattern as Path A. This applies whether you're building a completely new widget
or wrapping a plain JS library that doesn't ship its own Custom Element.

See [extending-components.md](references/extending-components.md) for the
vanilla Custom Element template, the wrapping walkthrough, and a complete
example.

### Path C — Compose webforJ components

Combine existing webforJ components (TextField, Button, FlexLayout, etc.) into
a new reusable component. Extend `Composite<T>`, use `getBoundComponent()` to
build the internal layout, and implement concern interfaces (`HasValue`,
`HasLabel`, etc.) to expose a clean API that delegates to inner components.

See [composition.md](references/composition.md) for the pattern, concern
interfaces, and a complete example.

### Path D — Extend an HTML element (lightweight fallback)

Only use this when writing a Custom Element would be overkill — e.g. a one-off
wrapper that doesn't need Shadow DOM, property bridging, or reuse across
projects. Extend `Div` (or another HTML element), override `onDidCreate()`,
initialize via `executeJs()`. See [extending-components.md](references/extending-components.md).

### Path E — Page-level utility

For browser APIs with no visible DOM widget (VirtualKeyboard, Notification,
geolocation). Plain Java class, `Page.getCurrent().executeJsVoidAsync()`,
`page.addEventListener()` + `PageEventOptions`, and `EventDispatcher` for
Java-side events. See [extending-components.md](references/extending-components.md).

## Custom Element Workflow

For Paths A and B. If using Path B, write the JS Custom Element first (see
[extending-components.md](references/extending-components.md)), then follow
these steps to create the Java wrapper.

```
- [ ] Step 0: Setup (once per project)
- [ ] Step 1: Extract component data
- [ ] Step 2: Write Java wrappers
- [ ] Step 3: Write tests
```

### Step 0: Setup (once per project)

**Always prefer local** — download third-party JS/CSS into `src/main/resources/static/libs/{library}/`.
Local resources are self-contained and work offline. Only use CDN as a last resort.

1. Install the npm package to a temp directory: `npm install --prefix /tmp/webforj-libs <package-name>`
2. Copy the required JS/CSS files into `src/main/resources/static/libs/{library}/`
3. **Scan copied CSS for dependent assets** — run `grep -E "url\(|@font-face|@import" *.css`
   on the copied CSS files. For every referenced path (fonts, images, other CSS),
   copy those files too preserving relative paths. Components often need font files,
   component-specific CSS, or image assets that the base CSS references.
4. **Verify all files exist on disk** before writing any Java code — `ls -R` the
   target directory and confirm every referenced asset is present
5. If the library ships multiple themes, list the available options and ask
   the user which one to use before proceeding
6. Use `ws://libs/{library}/` paths in `@JavaScript` and `@StyleSheet` annotations

### Step 1: Extract component data

**Path A — Library has a CEM** (Lit, Stencil, FASTElement, etc.):

Install the script dependency and the target library in `/tmp/webforj-cem/`:

```bash
npm install --prefix /tmp/webforj-cem @wc-toolkit/cem-utilities <package-name>
export NODE_PATH=/tmp/webforj-cem/node_modules
export CEM=$NODE_PATH/<package-name>/custom-elements.json
# Some packages use dist/ or cdn/ subdirectories — check the library's docs
```

If the library doesn't ship a CEM but uses Lit, Stencil, or FAST, generate one:

```bash
npx @custom-elements-manifest/analyzer analyze \
  --globs "$NODE_PATH/<package-name>/src/**/*.{js,ts}" \
  --outdir /tmp/webforj-cem
export CEM=/tmp/webforj-cem/custom-elements.json
```

Then parse it with the extraction script (`--help` for all options):

```bash
node scripts/extract-components.mjs --file "$CEM" --list
node scripts/extract-components.mjs --file "$CEM" --tag x-button
```

**No CEM and no supported framework** (vanilla JS, proprietary, etc.):
Read the component's docs, API reference, or source code. Write the spec JSON
manually. Run `node scripts/extract-components.mjs --format` to see the
expected format.

### Step 2: Write Java wrappers

Using the spec JSON from Step 1 and the reference files, write the Java wrapper
class for each component. Use the Decision Table below to choose the right base
class, property types, event patterns, and concern interfaces.

For each component:
- Place wrapper in a dedicated sub-package: `components/{component}/`
  with events in `components/{component}/event/`
- Add JavaDoc to the class and every public method — pull descriptions
  from the component's documentation
- Choose `ElementComposite` or `ElementCompositeContainer` based on slots
- Create `PropertyDescriptor` fields for each property
- Model complex objects as Java beans (POJOs), not `Map<String, Object>` —
  Gson serializes POJOs to JSON automatically
- Use enums with `@SerializedName` for properties with predefined values (variant, size, etc.)
- Create standalone event classes in an `event/` sub-package
- Add slot convenience methods with constants
- Implement applicable concern interfaces
- Skip properties that don't make sense server-side
- Do not add section separator comments (`// --- Properties ---`, etc.)

### Step 3: Write tests

Write JUnit 5 tests for each wrapper using the patterns in
[testing.md](references/testing.md):

- `@Nested @DisplayName("Properties API")` — `PropertyDescriptorTester.run()`
  plus fluent setter chain tests
- `@Nested @DisplayName("Slots API")` — `addTo{Slot}()` tests via
  `getOriginalElement().getFirstComponentInSlot()`
- `@Nested @DisplayName("Events API")` — dual listener tests
  (`onXxx` + `addXxxListener`)

## Decision Table

| Characteristic | Choice |
|---|---|
| No slots | `extends ElementComposite` |
| Has default/named slots | `extends ElementCompositeContainer` |
| Predefined values (variant, size) | `enum` with `@SerializedName` on values |
| Fires custom events | Standalone class in `event/` sub-package + `@EventName` |
| Needs JS init after attach | Override `onDidCreate()` |
| CSS custom properties on host | `setStyle("--prop", value)` methods |
| JS/CSS loading | **Prefer local**: download to `ws://libs/`, verify files exist. CDN only as last resort |
| Has form behavior | Implement `HasValue<T,V>`, `HasLabel<T>`, `HasRequired<T>`, etc. |
| Needs focus management | Implement `HasFocus<T>` |
| Container behavior | `ElementCompositeContainer` (includes `HasComponents`) |
| JS method calls | `getElement().callJsFunctionAsync()` — prefer async |

## MCP Tools

`webforj-mcp:webforj-knowledge-base` — component documentation and API reference.

## References

- [element-composite.md](references/element-composite.md) — Base classes, annotations, concern interfaces, resource loading
- [composition.md](references/composition.md) — Composite\<T\>, concern interfaces, delegation pattern
- [extending-components.md](references/extending-components.md) — Building Custom Elements, extending HTML elements, page-level utilities
- [properties.md](references/properties.md) — PropertyDescriptor patterns, enums, types
- [events.md](references/events.md) — @EventName, @EventOptions, event data extraction
- [anti-patterns.md](references/anti-patterns.md) — Common mistakes, validation checklist
- [testing.md](references/testing.md) — PropertyDescriptorTester + manual test patterns
- [javascript-interop.md](references/javascript-interop.md) — executeJs, callJsFunction, Page JS, component keyword
