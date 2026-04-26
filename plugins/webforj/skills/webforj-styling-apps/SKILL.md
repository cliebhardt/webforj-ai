---
name: webforj-styling-apps
description: "Use this skill for ANYTHING that changes the look of a webforJ app: colors, themes, palettes, branding, dark mode, button styles, fonts, spacing, shadows, borders, layouts, component appearance, or any CSS. Trigger phrases: 'make my app look like X', 'theme my app', 'change the colors', 'change the primary color', 'reskin', 'rebrand', 'use my brand color', 'apply dark mode', 'add a custom theme', 'why does this look wrong', 'restyle the buttons', 'change the font', 'use a hex color', 'override a CSS variable', 'style a dwc-component', 'use ::part()', 'pick spacing tokens', 'fix hardcoded color'. Routes through the webforj-mcp tools (get_versions, styles_list_tokens, styles_get_component, styles_validate_tokens, create_theme) so token names are version-correct, covers both DWC v1 (webforJ 25 and prior) and DWC v2 (webforJ 26+), and enforces preferring overrides of the built-in light/dark/dark-pure themes over a new custom theme."
---

# Styling webforJ Apps

webforJ ships a design system named **DWC**. Two generations exist:

- **DWC v1** — webforJ 25 and prior.
- **DWC v2** — webforJ 26 and later.

The agent must resolve the target webforJ version first and pass it to every styling-MCP tool call. The MCP server has a separate token catalog per major version, so wrong-version calls return `unknown_version`, and a token name that exists in one major may not be defined in another.

## Hard rules

1. **Use `--dwc-*` tokens.** Do not hardcode raw hex, rgb, or px values in component code or stylesheets.
2. **Resolve the target webforJ version once per task before any token decision.** Read `<webforj.version>` from the project's `pom.xml`. If unknown, call `webforj-mcp:get_versions` and ask the user.
3. **Use the MCP server as the token catalog.** Do not invent token names. Do not enumerate tokens from memory in generated code.
4. **Validate generated CSS before writing it to disk.** Run `webforj-mcp:styles_validate_tokens` with the resolved `webforjVersion` and fix every flagged token using the returned suggestions.
5. **Never carry token names across major versions.** A token that exists in DWC v1 may be absent or renamed in DWC v2 (and vice versa). Always re-list the catalog for the new version.
6. **Prefer overriding the built-in themes over creating a custom theme.** The default `light` theme is overridden at `:root`. The `dark` and `dark-pure` themes are overridden under `html[data-app-theme="dark"]` and `html[data-app-theme="dark-pure"]`. Only introduce a `html[data-app-theme='your-name']` custom theme when the requested behavior cannot be expressed by overriding the existing themes.

## MCP tool routing

`get_versions` takes no arguments. **Every other styling-MCP tool requires two augmented arguments on every call:**

- `webforjVersion` — string matching `^\d+\.\d+(-SNAPSHOT)?$` (e.g. `"25.12"`, `"26.00"`, or the current `"26.00-SNAPSHOT"`). Bare `"25"` or `"26"` is rejected.
- `reasoning` — your step-by-step reasoning for why you are calling this tool and what you expect it to return. Stripped before the handler runs.

| Tool | Use when | Tool-specific args (in addition to `webforjVersion` + `reasoning`) |
|---|---|---|
| `webforj-mcp:get_versions` | the target version is unknown, or you need the list of indexed majors | none |
| `webforj-mcp:styles_list_tokens` | "which global `--dwc-*` tokens exist for this version" | optional `prefix` (e.g. `--dwc-color-primary-`, `--dwc-space-`, `--dwc-color-`); optional `contains` (e.g. `seed`, `text`) |
| `webforj-mcp:styles_get_component` | "what is the CSS surface (vars, parts, reflected attributes, slots) for a component" | `name` (a DWC tag like `"dwc-button"` or a webforJ Java class like `"Button"`, `"TextField"`); optional `mode: "lookup"` (default), `"list"` for every valid DWC tag, or `"map"` for the Java class -> DWC tag mapping. Omit `name` when `mode` is `"list"` or `"map"`. |
| `webforj-mcp:styles_validate_tokens` | before saving any generated stylesheet | `content` (CSS, Java, Markdown, or MDX text) |
| `webforj-mcp:create_theme` | the user wants a full theme stylesheet generated from a brand color | `primaryColor: [hue, saturation, lightness]` as numbers in 0–360, 0–100, 0–100 (example: `[220, 70, 50]` for blue); optional `themeName` |

`styles_validate_tokens` returns invalid tokens with line numbers and ranked similar-name suggestions; iterate until the response is `valid: true`.

## Decision table

| Task | Approach |
|---|---|
| Color reskin (one or more palettes) | redefine palette config tokens at `:root` (see DWC v1 vs v2 below) |
| Direct color override (DWC v2 only) | `--dwc-color-{palette}-seed: <CSS color>` at `:root` |
| Adjust the light theme | redefine palette config tokens at `:root` (preferred) |
| Adjust the built-in dark or dark-pure theme | redefine palette config tokens under `html[data-app-theme="dark"]` or `html[data-app-theme="dark-pure"]` (preferred) |
| Custom theme (only when overriding the built-in themes is not enough) | `html[data-app-theme='your-name'] { ... }` |
| Custom dark theme (DWC v2 only, when a custom theme is required) | the same selector plus `--dwc-dark-mode: 1` and `color-scheme: dark` |
| Component-level styling | look up the component with `styles_get_component`; override its CSS variables on the tag selector; fall back to `::part()` only when no variable covers it |
| Layout / spacing | `--dwc-space-*` |
| Component sizing | `--dwc-size-*` |
| Typography | `--dwc-font-*` |
| Surfaces | `--dwc-surface-1/2/3` |
| Borders | `--dwc-border-width`, `--dwc-border-style`, `--dwc-border-radius-*` |
| Shadows | `--dwc-shadow-*` |
| Transitions and easings | `--dwc-transition-*`, `--dwc-ease-*` |
| Disabled / focus | `--dwc-disabled-*`, `--dwc-focus-ring-*` |
| Reskin from a brand color (DWC v2) | a single `--dwc-color-{palette}-seed` line at `:root` is enough — the seed regenerates all shades, variations, text-contrast tokens, borders, and focus rings automatically |
| Reskin from a brand color (DWC v1) | redefine `-h` / `-s` (and optional `-c`) at `:root`, or call `webforj-mcp:create_theme` to generate the full variation stylesheet |
| Generated full theme stylesheet | `webforj-mcp:create_theme` (mainly useful when you want the tool's full file output rather than writing seed lines yourself) |

## Workflow

```
- [ ] 1. Resolve the target webforJ version
- [ ] 2. Classify the task (decision table above)
- [ ] 3. Look up the tokens or component CSS surface via MCP
- [ ] 4. Write CSS using only the names MCP returned
- [ ] 5. Validate the generated CSS via MCP
- [ ] 6. Wire the stylesheet onto the App
```

### 1. Resolve the target webforJ version

Read `<webforj.version>` from the project's `pom.xml`. You need the full `major.minor` string (e.g. `"25.12"`, `"26.00"`, or `"26.00-SNAPSHOT"`). That exact string is what every styling-MCP tool requires. The MCP server's argument validator regex is `^\d+\.\d+(-SNAPSHOT)?$`, so bare `"25"` or `"26"` is rejected.

The major number determines which DWC generation the work targets:

- `25.x` and earlier -> **DWC v1**
- `26.x` and later -> **DWC v2**

If the version is not in `pom.xml`, or the version is not in the MCP server's indexed majors, call `webforj-mcp:get_versions` and ask the user.

### 2. Classify the task

Use the decision table above. Combine rows when a task has multiple aspects (a button styling task may need component CSS vars AND surface tokens).

### 3. Look up the tokens or component CSS surface

For global tokens (palette, surface, spacing, typography, borders, shadows, transitions, focus rings):

```
webforj-mcp:styles_list_tokens
  webforjVersion: <resolved>            # required, e.g. "25.12" or "26.00"
  reasoning: <why you are calling this> # required
  prefix: --dwc-color-primary-          # optional. Source examples: --dwc-color-primary-, --dwc-space-, --dwc-color-
  contains: seed                        # optional. Source examples: seed, text
```

For per-component CSS variables, parts, slots, reflected attributes:

```
webforj-mcp:styles_get_component
  webforjVersion: <resolved>
  reasoning: <why>
  name: dwc-button                  # accepts the DWC tag, or the webforJ Java class name like Button or TextField
```

For all valid DWC tags for the version, pass `mode: "list"` (and omit `name`). For the Java class to DWC tag mapping, pass `mode: "map"` (and omit `name`).

Use only names returned by these calls. Do not invent and do not carry tokens between versions.

### 4. Write CSS

Two documented mechanisms for component styling:

- **CSS variables** on the tag selector:

  ```css
  dwc-button {
    --dwc-button-font-weight: 400;
  }
  ```

- **Shadow parts** via `::part()`:

  ```css
  dwc-button::part(label) {
    color: red;
  }
  ```

Global overrides go at `:root`:

```css
:root {
  --dwc-color-primary-h: 220;
  --dwc-color-primary-s: 75%;
}
```

One documented `::part()` limit: you cannot select inside a part. `dwc-button::part(label) span` matches nothing.

### 5. Validate

Always run before writing the stylesheet to disk:

```
webforj-mcp:styles_validate_tokens
  webforjVersion: <resolved>
  reasoning: <why>
  content: <the CSS, Java, Markdown, or MDX text>
```

Apply every suggested fix until `valid: true`.

### 6. Apply the theme

The four built-in app themes are `light`, `dark`, `dark-pure`, `system`. Apply with `@AppTheme("dark")` or `App.setTheme("dark")`.

When the work is in a stylesheet, the project's existing convention for loading CSS into the app applies. Do not invent a load mechanism, use whatever the project already does.

## Universal facts (DWC v1 and v2)

The following are present in both versions' canonical docs. Always confirm specific token names with `styles_list_tokens` for the resolved version.

### Seven palettes

`primary`, `success`, `warning`, `danger`, `info`, `default`, `gray`. Plus globals `black` / `white`.

### Shade scale

19 shades per palette: `--dwc-color-{palette}-{5..95}` in steps of 5. Step 5 is the darkest and step 95 is the lightest.

Two text-contrast siblings per shade:

```
--dwc-color-{palette}-text-{5..95}        surface-safe text in the palette color
--dwc-color-on-{palette}-text-{5..95}     text for use ON the shade as a background
```

### Variation tokens

Both versions document the per-palette variation tokens `--dwc-color-{palette}` (normal), `-dark`, `-light`, and `-alt`, plus matching `text` and `on-*-text` siblings. The "groups" framing differs: DWC v1 describes four groups (Normal, Dark, Light, Alt); DWC v2 describes three groups (normal, dark, light), with `-alt` listed as an additional token.

### Surfaces

Three surface tokens for organizing UI hierarchy:

```
--dwc-surface-1   page / body background
--dwc-surface-2   cards / toolbars
--dwc-surface-3   menus / popovers / dialogs
```

### App themes

The four built-in themes are `light`, `dark`, `dark-pure`, `system`. Apply one with `@AppTheme("name")` or `App.setTheme("name")`.

**Prefer overriding the built-in themes** (Hard rule 6):

- Override the **light** theme by redefining CSS custom properties at `:root`.
- Override the **dark** or **dark-pure** themes with `html[data-app-theme="dark"]` or `html[data-app-theme="dark-pure"]`.

**Custom themes** are defined via `html[data-app-theme='your-name']`. Use that path only when the user's requirements cannot be met by overriding the built-in themes.

### Component themes

Components support seven theme attributes drawn from the palettes: `default`, `primary`, `success`, `warning`, `danger`, `info`, `gray`.

### Shadow parts

Components inside the shadow DOM expose elements via `part="..."` attributes. Style them from outside with `::part(name)`. You cannot select inside a part:

```css
/* Does NOT work */
dwc-button::part(label) span { color: pink; }
```

Pseudo-classes on parts work (`::part(label):hover`).

### CSS variables, generally

Any `--dwc-*` token can be overridden by redefining it within a CSS selector that targets where it should apply (`:root`, a tag selector for component scope). `var()` accepts a fallback. From Java, `setStyle("--dwc-...","value")` updates a variable on a component instance.

## DWC v1 (webforJ 25 and prior)

The following are documented for DWC v1 and either differ in DWC v2 or do not exist in DWC v2.

### Palette configuration

Each palette is generated from three configuration variables:

| Variable | Range | Description |
|---|---|---|
| `--dwc-color-{palette}-h` | 0–360 | hue |
| `--dwc-color-{palette}-s` | 0%–100% | saturation |
| `--dwc-color-{palette}-c` | 0–100 | contrast threshold (controls when generated text flips between light and dark on a colored background) |

```css
:root {
  --dwc-color-primary-h: 225;
  --dwc-color-primary-s: 100%;
  --dwc-color-primary-c: 60;
}
```

### Border radius

Em-based scale, no seed variable:

```
--dwc-border-radius-2xs   0.071em
--dwc-border-radius-xs    0.125em
--dwc-border-radius-s     0.25em
--dwc-border-radius-m     0.375em
--dwc-border-radius-l     0.5em
--dwc-border-radius-xl    0.75em
--dwc-border-radius-2xl   1em
--dwc-border-radius-round 50%
--dwc-border-radius-pill  9999px
--dwc-border-radius       var(--dwc-border-radius-s)
```

### Transitions

```
--dwc-transition-x-slow  1000ms
--dwc-transition-slow    500ms
--dwc-transition-medium  250ms
--dwc-transition-fast    150ms
--dwc-transition-x-fast  50ms
--dwc-transition         var(--dwc-transition-medium)
```

### Focus state

```
--dwc-focus-ring-l       45%
--dwc-focus-ring-a       0.4
--dwc-focus-ring-width   3px
```

### Disabled state

```
--dwc-disabled-opacity   0.7
--dwc-disabled-cursor    var(--dwc-cursor-disabled)
```

### Typography

Font sizes: `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` plus base `--dwc-font-size`.

Font weights: `lighter` (200), `light` (300), `normal` (400), `semibold` (500), `bold` (700), `bolder` (800).

Line heights: `--dwc-font-line-height-{2xs..2xl}` plus base `--dwc-font-line-height`.

Default body font size is `--dwc-font-size-s`.

## DWC v2 (webforJ 26+)

The following are documented for DWC v2 and either are new or differ from DWC v1.

### Palette configuration

Each palette is generated from two seed variables:

| Variable | Description |
|---|---|
| `--dwc-color-{palette}-h` | hue (0–360) |
| `--dwc-color-{palette}-s` | saturation (0%–100%) |

There is no `-c` (contrast threshold) variable in DWC v2. WCAG AA contrast for generated text colors is met automatically.

Each palette also exposes `--dwc-color-{palette}-seed` as a **direct color override**. By default it is constructed from `-h` and `-s`. Setting it directly with any valid CSS color bypasses the hue/saturation system:

```css
:root {
  --dwc-color-primary-seed: #6366f1;
}
```

Default seeds shipped on the default theme:

```
--dwc-color-primary-h: 223;  --dwc-color-primary-s: 91%;
--dwc-color-success-h: 153;  --dwc-color-success-s: 60%;
--dwc-color-warning-h: 35;   --dwc-color-warning-s: 90%;
--dwc-color-danger-h:  4;    --dwc-color-danger-s:  90%;
--dwc-color-info-h:    262;  --dwc-color-info-s:    65%;
--dwc-color-gray-h:    0;    --dwc-color-gray-s:    0%;
--dwc-color-default-h: var(--dwc-color-primary-h);
--dwc-color-default-s: 3%;
```

### Hue rotation

`--dwc-color-hue-rotate` (default `3` degrees) shifts hue across the palette. Set to `0` to disable.

### Tint

`--dwc-color-{palette}-tint` is the seed color at 12% opacity. Used for subtle highlight backgrounds.

### Variation step mapping

```
--dwc-color-{palette}-dark   -> --dwc-color-{palette}-45
--dwc-color-{palette}        -> --dwc-color-{palette}-50
--dwc-color-{palette}-light  -> --dwc-color-{palette}-55
--dwc-color-{palette}-alt    -> --dwc-color-{palette}-tint
```

### Global colors

| Variable | Description |
|---|---|
| `--dwc-color-black` | Near-black in light mode, near-white in dark mode. |
| `--dwc-color-white` | Near-white in light mode, near-black in dark mode. |
| `--dwc-color-body-text` | Default body text color (uses `--dwc-color-black`). |

### Border-color tokens

```
--dwc-border-color                     mode-aware default
--dwc-border-color-emphasis            stronger default
--dwc-border-color-{palette}           per-palette
--dwc-border-color-{palette}-emphasis  per-palette stronger
```

### Border radius

Seed-based scale:

```
--dwc-border-radius-seed   0.5rem (8px at 16px root)
--dwc-border-radius-2xs    0.0625rem (1px, fixed)
--dwc-border-radius-xs     0.125rem  (2px, fixed)
--dwc-border-radius-s      calc(seed * 0.5)
--dwc-border-radius-m      calc(seed * 0.75)
--dwc-border-radius-l      var(--dwc-border-radius-seed)
--dwc-border-radius-xl     calc(seed * 1.5)
--dwc-border-radius-2xl    calc(seed * 2)
--dwc-border-radius-3xl    calc(seed * 3)
--dwc-border-radius-4xl    calc(seed * 4)
--dwc-border-radius-round  50%
--dwc-border-radius-pill   calc(var(--dwc-size-m) / 2)
--dwc-border-radius        var(--dwc-border-radius-seed)
```

Documented usage: `s` for items inside containers, `m` for structural borders between item and container, `l` for containers and surfaces, `xl` for large overlays.

### Transitions

```
--dwc-transition-x-slow  1000ms
--dwc-transition-slow    300ms
--dwc-transition-medium  250ms
--dwc-transition-fast    150ms
--dwc-transition-x-fast  100ms
--dwc-transition         var(--dwc-transition-medium)
```

### Standard easings

Added in DWC v2 alongside the extended set:

```
--dwc-ease           cubic-bezier(0.4, 0, 0.2, 1)
--dwc-ease-out       cubic-bezier(0, 0, 0.2, 1)
--dwc-ease-in        cubic-bezier(0.4, 0, 1, 1)
--dwc-ease-outGlide  cubic-bezier(0.32, 0.72, 0, 1)
```

### Scale tokens

```
--dwc-scale-press       0.97   (3% shrink)
--dwc-scale-press-deep  0.93   (7% shrink)
```

### Focus state

```
--dwc-focus-ring-a       0.75
--dwc-focus-ring-width   2px
--dwc-focus-ring-gap     2px
--dwc-focus-ring-{palette}
```

### Disabled state

`--dwc-disabled-opacity` adapts to light or dark mode. `--dwc-disabled-cursor` resolves to `var(--dwc-cursor-disabled)`.

### Typography

Font sizes: `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` plus base `--dwc-font-size`. Default body size is `--dwc-font-size-m` (`0.875rem`, 14px).

Font weights: `thin` (100), `lighter` (200), `light` (300), `normal` (400), `medium` (500), `semibold` (600), `bold` (700), `bolder` (800).

Font family: `--dwc-font-family-sans` resolves through `system-ui`, with `--dwc-font-family-mono` and `--dwc-font-family` (defaults to sans).

### Custom themes

Same `html[data-app-theme='your-name']` selector. To make a custom theme dark, set on the same selector:

```css
html[data-app-theme="new-dark-theme"] {
  --dwc-dark-mode: 1;
  color-scheme: dark;
  --dwc-color-primary-h: 280;
  --dwc-color-primary-s: 100%;
}
```

## Quick reference

| Need | API |
|---|---|
| Discover available webforJ majors | `webforj-mcp:get_versions` (no args) |
| List global `--dwc-*` tokens for a version | `webforj-mcp:styles_list_tokens(webforjVersion, reasoning, prefix?, contains?)` |
| Get a component's CSS vars / parts / slots / reflected attributes | `webforj-mcp:styles_get_component(webforjVersion, reasoning, name?, mode?)` (`mode`: `"lookup"` default, `"list"`, `"map"`) |
| Validate every `--dwc-*` reference in CSS / Java / Markdown / MDX | `webforj-mcp:styles_validate_tokens(webforjVersion, reasoning, content)` |
| Reskin from a brand color (DWC v2) | one line: `--dwc-color-{palette}-seed: <CSS color>` at `:root` |
| Generate a full theme stylesheet (mostly useful for DWC v1) | `webforj-mcp:create_theme(webforjVersion, reasoning, primaryColor: [h, s, l], themeName?)` |
| Adjust the light theme (preferred over a custom theme) | redefine palette config tokens at `:root` |
| Adjust the dark theme (preferred over a custom theme) | redefine palette config tokens under `html[data-app-theme="dark"]` |
| Adjust the dark-pure theme (preferred over a custom theme) | redefine palette config tokens under `html[data-app-theme="dark-pure"]` |
| Reskin one palette (DWC v1 and v2) | `--dwc-color-{palette}-h` and `--dwc-color-{palette}-s` |
| Tune contrast threshold (DWC v1 only) | `--dwc-color-{palette}-c` |
| Direct color override (DWC v2 only) | `--dwc-color-{palette}-seed` |
| Custom theme (only when overriding the built-ins is insufficient) | `html[data-app-theme='your-name']` |
| Custom dark theme (DWC v2 only, when a custom theme is needed) | as above plus `--dwc-dark-mode: 1` and `color-scheme: dark` |
| Apply a theme | `@AppTheme("name")` or `App.setTheme("name")` |

## Resources

### references/

- [colors.md](references/colors.md) — palette structure and per-version differences.
- [themes.md](references/themes.md) — palette reskin, seed override, custom themes, per-version differences.
- [component-styling.md](references/component-styling.md) — shadow parts, CSS variables, reflected attributes, table renderer parts.
- [table.md](references/table.md) — component-specific table styling guidance.
- [google-charts.md](references/google-charts.md) — chart-specific styling guidance.
