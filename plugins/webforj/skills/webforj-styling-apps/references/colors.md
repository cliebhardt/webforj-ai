# DWC Colors

For the actual token catalog of the resolved version, call `webforj-mcp:styles_list_tokens` with the augmented args `webforjVersion` and `reasoning`, plus an optional `prefix` like `--dwc-color-`.

## Universal facts (DWC v1 and v2)

### Shade syntax

```
--dwc-color-{palette}-{step}
```

`{step}` is a number from 5 to 95 in increments of 5. Step 5 is the darkest, step 95 is the lightest.

### Palettes

- `default` — neutral, tinted with the primary
- `primary` — brand color
- `success`, `warning`, `danger` — semantic status
- `info` — complementary / secondary emphasis
- `gray` — pure gray scale
- `black`, `white` — globals (see per-version notes below)

### Variation tokens

Both versions define abstract variation variables that pull from underlying shades. Components use these instead of raw shade numbers.

Groups that exist in both:

- **Normal** — base background, text, border, focus ring
- **Dark** — active / pressed states
- **Light** — hover / focus states
- **Alt** — secondary highlights

Per group, both versions document:

```
--dwc-color-{palette}                normal background / fill
--dwc-color-{palette}-dark           dark variant
--dwc-color-{palette}-light          light variant
--dwc-color-{palette}-alt            alt variant
--dwc-color-{palette}-text           surface-safe text in palette color
--dwc-color-{palette}-text-dark      darker surface-safe text
--dwc-color-{palette}-text-light     lighter surface-safe text
--dwc-color-on-{palette}-text        text ON --dwc-color-{palette}
--dwc-color-on-{palette}-text-dark   text ON --dwc-color-{palette}-dark
--dwc-color-on-{palette}-text-light  text ON --dwc-color-{palette}-light
--dwc-color-on-{palette}-text-alt    text ON --dwc-color-{palette}-alt
--dwc-border-color-{palette}         per-palette border color
--dwc-focus-ring-{palette}           per-palette focus ring
```

### Dark mode behavior

Both versions describe the same flipped-color strategy: shade lightness is interpreted relative to mode, so the same component CSS keeps working in both light and dark themes. Code stays the same, mid-tone backgrounds remain mid-tone visually but flip to suit the surface.

## DWC v1 only

### Palette configuration

Each palette is generated based on three variables:

| Variable | Description |
|---|---|
| `hue` | the angle (in degrees) on the color wheel |
| `saturation` | a percentage indicating color intensity |
| `contrast-threshold` | a value between 0 and 100 that determines whether text should be light or dark based on background lightness |

Set them at `:root`:

```css
:root {
  --dwc-color-primary-h: 225;
  --dwc-color-primary-s: 100%;
  --dwc-color-primary-c: 60;
}
```

### Per-palette variation values

The v1 doc shows the exact step mappings for each palette. Examples (from the doc tabs):

Default / Tone:

```
--dwc-color-default-dark: var(--dwc-color-default-85);
--dwc-color-default:      var(--dwc-color-default-90);
--dwc-color-default-light: var(--dwc-color-default-95);
--dwc-color-default-alt:  var(--dwc-color-primary-alt);
```

Primary:

```
--dwc-color-primary-dark:  var(--dwc-color-primary-35);
--dwc-color-primary:       var(--dwc-color-primary-40);
--dwc-color-primary-light: var(--dwc-color-primary-45);
--dwc-color-primary-alt:   var(--dwc-color-primary-95);
```

Each palette also defines a `--dwc-focus-ring-{palette}` value built from `hsla(...)` using the palette's `-h`, `-s`, plus `--dwc-focus-ring-l` and `--dwc-focus-ring-a`.

## DWC v2 only

### Palette configuration

Each palette is generated from two seed variables:

| Seed Variable | Description |
|---|---|
| `--dwc-color-{name}-h` | hue angle of the seed color (0–360) |
| `--dwc-color-{name}-s` | saturation percentage (0% to 100%) |

There is no `-c` (contrast threshold) variable in DWC v2. The v2 doc states: "All generated text colors meet WCAG AA contrast requirements automatically."

Default values shipped on the default theme:

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

### Direct seed override

Each palette also exposes `--dwc-color-{name}-seed`:

```css
:root {
  --dwc-color-primary-seed: #6366f1;
}
```

By default this is constructed from the hue and saturation values, but it can be overridden directly with any valid CSS color to bypass the hue/saturation system entirely.

### Hue rotation

```
--dwc-color-hue-rotate   default: 3 (degrees)
```

The palette generator applies a subtle hue rotation across steps. Darker shades shift slightly warm while lighter shades shift slightly cool. Set to 0 to disable.

### Generated variables per step

For each step, three variables are produced:

| Variable Pattern | Description |
|---|---|
| `--dwc-color-{name}-{step}` | the palette shade at that step |
| `--dwc-color-{name}-text-{step}` | a surface-safe text color derived from that step (WCAG AA) |
| `--dwc-color-on-{name}-text-{step}` | text color for use ON the shade as a background (auto-flips light/dark) |

### Additional generated variables

| Variable Pattern | Description |
|---|---|
| `--dwc-color-{name}-tint` | the seed color at 12% opacity, for subtle highlight backgrounds |
| `--dwc-border-color-{name}` | mode-aware border color tinted with the palette hue |
| `--dwc-border-color-{name}-emphasis` | stronger mode-aware border color |
| `--dwc-focus-ring-{name}` | focus ring shadow for the palette |

### Variation step mapping

DWC v2 has three variation groups (`normal`, `dark`, `light`) plus an `alt` token. The mapping per palette:

Primary:

```
--dwc-color-primary-dark:  var(--dwc-color-primary-45);
--dwc-color-primary:       var(--dwc-color-primary-50);
--dwc-color-primary-light: var(--dwc-color-primary-55);
--dwc-color-primary-alt:   var(--dwc-color-primary-tint);

--dwc-color-primary-text-dark:  var(--dwc-color-primary-text-40);
--dwc-color-primary-text:       var(--dwc-color-primary-text-45);
--dwc-color-primary-text-light: var(--dwc-color-primary-text-50);

--dwc-color-on-primary-text-dark:  var(--dwc-color-on-primary-text-45);
--dwc-color-on-primary-text:       var(--dwc-color-on-primary-text-50);
--dwc-color-on-primary-text-light: var(--dwc-color-on-primary-text-55);
--dwc-color-on-primary-text-alt:   var(--dwc-color-primary-text);
```

Other palettes follow the same step pattern.

### Global colors

| Variable | Description |
|---|---|
| `--dwc-color-black` | Near-black in light mode, near-white in dark mode. |
| `--dwc-color-white` | Near-white in light mode, near-black in dark mode. |
| `--dwc-color-body-text` | Default body text color (uses `--dwc-color-black`). |
