# webforJ Design Tokens — Complete Reference

All tokens use the `--dwc-*` prefix and are set on `:root`. Override on `:root`
for global changes or on a component selector for scoped changes.

---

## Colors

### Mode-Aware Colors

| Token                    | Light mode     | Dark mode      |
|--------------------------|----------------|----------------|
| `--dwc-color-black`      | Near-black     | Near-white     |
| `--dwc-color-white`      | Near-white     | Near-black     |
| `--dwc-color-body-text`  | Uses black     | Uses white     |

These flip with mode — they are NOT static.

### Palettes

**Names:** `default`, `primary`, `success`, `warning`, `danger`, `info`, `gray`

**Shades:** 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95

| Pattern                                  | Description                                     |
|------------------------------------------|-------------------------------------------------|
| `--dwc-color-{palette}-{shade}`          | Shade color. 5 = darkest, 95 = lightest (absolute). |
| `--dwc-color-{palette}-text-{shade}`     | Surface-safe text for that shade.                |
| `--dwc-color-on-{palette}-text-{shade}`  | On-palette text (directly on shade as bg).       |

### Semantic / Abstract Colors

| Pattern                                  | Description                                     |
|------------------------------------------|-------------------------------------------------|
| `--dwc-color-{palette}`                  | Normal state                                    |
| `--dwc-color-{palette}-dark`             | Active / selected state                         |
| `--dwc-color-{palette}-light`            | Hover / focus state                             |
| `--dwc-color-{palette}-alt`              | Secondary highlight                             |
| `--dwc-color-{palette}-tint`             | Seed at 12% opacity (subtle alt bg)             |
| `--dwc-color-{palette}-text`             | Text on palette background                      |
| `--dwc-color-{palette}-text-dark`        | Text on dark variant                            |
| `--dwc-color-{palette}-text-light`       | Text on light variant                           |
| `--dwc-color-{palette}-text-alt`         | Text on alt variant                             |

### On-Text Tokens

Text colors for use on `{palette}-text` backgrounds (inverted contrast):

| Pattern                                  | Description                                     |
|------------------------------------------|-------------------------------------------------|
| `--dwc-color-on-{palette}-text`          | Text on palette-text background                 |
| `--dwc-color-on-{palette}-text-dark`     | Dark variant                                    |
| `--dwc-color-on-{palette}-text-light`    | Light variant                                   |
| `--dwc-color-on-{palette}-text-alt`      | Alt variant                                     |

### Border & Focus Ring Colors

| Pattern                                  | Description                                     |
|------------------------------------------|-------------------------------------------------|
| `--dwc-border-color`                     | Base border color (default palette)              |
| `--dwc-border-color-emphasis`            | Stronger base border                             |
| `--dwc-border-color-{palette}`           | Border color for palette                        |
| `--dwc-border-color-{palette}-emphasis`  | Stronger border variant                         |
| `--dwc-focus-ring-{palette}`             | Focus ring color (gap pattern shadow)            |

### Palette Configuration

Override these to reskin a palette. All shades recalculate automatically via OKLCH.

| Pattern                                  | Description                                     |
|------------------------------------------|-------------------------------------------------|
| `--dwc-color-{palette}-h`               | Hue (0–360)                                     |
| `--dwc-color-{palette}-s`               | Saturation (0%–100%)                             |
| `--dwc-color-{palette}-seed`            | Direct override (any CSS color: hex, rgb, oklch) |
| `--dwc-color-hue-rotate`                | Hue shift across palette (default: 3deg)         |

**`-c` does not exist.** Text contrast is automatic at OKLCH 0.59 lightness.

**Seed behavior:** The seed `-h`/`-s` (or `-seed`) is a starting point, not a promise. The palette uses absolute OKLCH lightness per step, so the exact input color won't appear at a predictable step. Bright hues (cyan, yellow) with high natural OKLCH lightness land around step 80–85, not 50. Dark hues (blue) sit near step 40–45.

---

## Typography

### Font Families

`--dwc-font-family-sans`, `--dwc-font-family-mono`, `--dwc-font-family` (alias -> sans)

### Font Sizes

Scale: `3xs` -> `2xs` -> `xs` -> `s` -> `m` -> `l` -> `xl` -> `2xl` -> `3xl`

| Token | Size |
|-------|------|
| `--dwc-font-size-3xs` | 0.625rem (10px) |
| `--dwc-font-size-2xs` | 0.6875rem (11px) |
| `--dwc-font-size-xs` | 0.75rem (12px) |
| `--dwc-font-size-s` | 0.8125rem (13px) |
| `--dwc-font-size-m` | 0.875rem (14px) |
| `--dwc-font-size-l` | 1rem (16px) |
| `--dwc-font-size-xl` | 1.25rem (20px) |
| `--dwc-font-size-2xl` | 1.625rem (26px) |
| `--dwc-font-size-3xl` | 2.125rem (34px) |
| `--dwc-font-size` | alias -> m |

### Font Weights

| Token | Value |
|-------|-------|
| `--dwc-font-weight-thin` | 100 |
| `--dwc-font-weight-lighter` | 200 |
| `--dwc-font-weight-light` | 300 |
| `--dwc-font-weight-normal` | 400 |
| `--dwc-font-weight-medium` | 500 |
| `--dwc-font-weight-semibold` | 600 |
| `--dwc-font-weight-bold` | 700 |
| `--dwc-font-weight-bolder` | 800 |
| `--dwc-font-weight-black` | 900 |
| `--dwc-font-weight` | alias -> normal |

### Line Heights

Scale: `3xs` -> `2xs` -> `xs` -> `s` -> `m` -> `l` -> `xl` -> `2xl` -> `3xl`

`--dwc-font-line-height-3xs` (1) through `--dwc-font-line-height-3xl` (2) in 0.125 steps.
`--dwc-font-line-height` (alias -> xs, 1.25)

---

## Spacing

Margin, padding, and gap values (rem-based, scale with browser font-size).
Scale: `3xs` -> `2xs` -> `xs` -> `s` -> `m` -> `l` -> `xl` -> `2xl` -> `3xl`

| Token | Size |
|-------|------|
| `--dwc-space-3xs` | 1px |
| `--dwc-space-2xs` | 2px |
| `--dwc-space-xs` | 4px |
| `--dwc-space-s` | 8px |
| `--dwc-space-m` | 16px |
| `--dwc-space-l` | 20px |
| `--dwc-space-xl` | 24px |
| `--dwc-space-2xl` | 28px |
| `--dwc-space-3xl` | 32px |
| `--dwc-space` | alias -> s |

---

## Sizing

Component width/height values. `m` is the standard component size.
Scale: `3xs` -> `2xs` -> `xs` -> `s` -> `m` -> `l` -> `xl` -> `2xl` -> `3xl`

| Token | Size |
|-------|------|
| `--dwc-size-3xs` | 18px |
| `--dwc-size-2xs` | 22px |
| `--dwc-size-xs` | 26px |
| `--dwc-size-s` | 30px |
| `--dwc-size-m` | 36px |
| `--dwc-size-l` | 44px |
| `--dwc-size-xl` | 52px |
| `--dwc-size-2xl` | 64px |
| `--dwc-size-3xl` | 68px |
| `--dwc-size` | alias -> m |

---

## Borders

### Width & Style

`--dwc-border-width` (1px), `--dwc-border-style` (solid)

### Border Radius (seed-based)

All sizes scale proportionally from `--dwc-border-radius-seed` (0.5rem / 8px).

| Token | Size | Multiplier |
|-------|------|-----------|
| `--dwc-border-radius-2xs` | 1px | fixed |
| `--dwc-border-radius-xs` | 2px | fixed |
| `--dwc-border-radius-s` | 4px | 0.5x seed |
| `--dwc-border-radius-m` | 6px | 0.75x seed |
| `--dwc-border-radius-l` | 8px | 1x seed |
| `--dwc-border-radius-xl` | 12px | 1.5x seed |
| `--dwc-border-radius-2xl` | 16px | 2x seed |
| `--dwc-border-radius-3xl` | 24px | 3x seed |
| `--dwc-border-radius-4xl` | 32px | 4x seed |
| `--dwc-border-radius-round` | 50% | circle |
| `--dwc-border-radius-pill` | 18px | size-m / 2 |
| `--dwc-border-radius` | alias -> seed |

Override `--dwc-border-radius-seed` to scale all radii proportionally.

Usage guide: items inside containers `s`, structural borders `m`, containers `l`, large overlays `xl`.

---

## Shadows (mode-adaptive)

Box-shadow tokens. Each level stacks progressively more layers. Strength auto-scales: 1x in light mode, 5x in dark mode via `--dwc-shadow-strength`.

| Token | Layers |
|-------|--------|
| `--dwc-shadow-xs` | 1 |
| `--dwc-shadow-s` | 2 |
| `--dwc-shadow-m` | 3 |
| `--dwc-shadow-l` | 4 |
| `--dwc-shadow-xl` | 5 |
| `--dwc-shadow-2xl` | 6 |
| `--dwc-shadow` | alias |
| `--dwc-shadow-color` | derived from default seed |
| `--dwc-shadow-strength` | `calc(1 + var(--dwc-dark-mode) * 4)` — 1x light, 5x dark |

---

## Surfaces

Three background hierarchy levels. Tinted with primary hue. Adapt automatically in dark mode.

| Token            | Use for                    | Light  | Dark   |
|------------------|----------------------------|--------|--------|
| `--dwc-surface-1`| Page body                  | 96%    | 15%    |
| `--dwc-surface-2`| Toolbars, menubars, panels | 97.5%  | 19%    |
| `--dwc-surface-3`| Windows, menus, dialogs    | 99%    | 24%    |

---

## Windows

Tokens for dialog / window components.

| Token                            | Description                  |
|----------------------------------|------------------------------|
| Token                            | Default                              |
|----------------------------------|--------------------------------------|
| `--dwc-window-background`        | `var(--dwc-surface-2)`               |
| `--dwc-window-border`            | `0.5px solid oklch(...)`             |
| `--dwc-window-box-shadow`        | `var(--dwc-shadow-s)`                |
| `--dwc-window-border-radius`     | `var(--dwc-border-radius-l)`         |
| `--dwc-window-header-background` | `var(--dwc-surface-3)`               |
| `--dwc-window-header-color`      | `var(--dwc-color-body-text)`         |
| `--dwc-window-header-font-weight`| `var(--dwc-font-weight-semibold)`    |
| `--dwc-window-header-box-shadow` | inset bottom border shadow           |

---

## Z-Index

| Token              | Use for                                |
|--------------------|----------------------------------------|
| `--dwc-zindex-h0`  | Backdrops                              |
| `--dwc-zindex-h1`  | Dialogs                                |
| `--dwc-zindex-h2`  | Popovers                               |
| `--dwc-zindex-h3`  | Dropdowns, menus, lists, calendars     |
| `--dwc-zindex-h4`  | Higher overlay needs                   |
| `--dwc-zindex-h5`  | Highest                                |

---

## Transitions & Easing

### Durations

| Token | Duration |
|-------|----------|
| `--dwc-transition-x-slow` | 1000ms |
| `--dwc-transition-slow` | 300ms |
| `--dwc-transition-medium` | 250ms |
| `--dwc-transition-fast` | 150ms |
| `--dwc-transition-x-fast` | 100ms |
| `--dwc-transition` | alias -> medium |

### Standard Easing

`--dwc-ease` (general), `--dwc-ease-out`, `--dwc-ease-in`, `--dwc-ease-outGlide`

### Extended Easing Curves

`inQuad`, `outQuad`, `inOutQuad`, `inCubic`, `outCubic`, `inOutCubic`,
`inQuart`, `outQuart`, `inOutQuart`, `inQuint`, `outQuint`, `inOutQuint`,
`inExpo`, `outExpo`, `inOutExpo`, `inCirc`, `outCirc`, `inOutCirc`,
`inBack`, `outBack`, `inOutBack`

All prefixed: `--dwc-ease-{name}`

---

## Dark Mode

| Token | Values | Description |
|-------|--------|-------------|
| `--dwc-dark-mode` | `0` (light) / `1` (dark) | Binary flag that controls all mode-dependent properties |

Set automatically by the built-in themes (`light`, `dark`, `dark-pure`). When creating custom themes, set it explicitly:

```css
html[data-app-theme='my-dark'] {
  --dwc-dark-mode: 1;
  color-scheme: dark;
}
```

Properties that read this flag: surfaces, shadows (5x strength), semantic color variations, black/white swap, disabled opacity, focus ring lightness, border colors.

---

## Cursors

| Token                        | Usage               |
|------------------------------|---------------------|
| `--dwc-cursor-click`         | Clickable elements  |
| `--dwc-cursor-text`          | Text input          |
| `--dwc-cursor-disabled`      | Disabled elements   |
| `--dwc-cursor-grab`          | Grabbable           |
| `--dwc-cursor-grabbing`      | Actively grabbing   |
| `--dwc-cursor-move`          | Movable elements    |
| `--dwc-cursor-resize-row`    | Row resize          |
| `--dwc-cursor-resize-column` | Column resize       |
| `--dwc-cursor-progress`      | In progress         |
| `--dwc-cursor-wait`          | Waiting / loading   |

---

## State

### Disabled

`--dwc-disabled-opacity` — `calc(0.35 + var(--dwc-dark-mode) * 0.15)` (35% light, 50% dark)
`--dwc-disabled-cursor` — `not-allowed`

### Focus Ring (gap pattern)

| Token | Default | Description |
|-------|---------|-------------|
| `--dwc-focus-ring-a` | 0.75 | Alpha |
| `--dwc-focus-ring-width` | 2px | Ring width |
| `--dwc-focus-ring-gap` | 2px | Gap between component and ring |

Per-palette: `--dwc-focus-ring-{palette}` — double box-shadow with surface gap.

### Scale Press

| Token | Default | Description |
|-------|---------|-------------|
| `--dwc-scale-press` | 0.97 | 3% shrink on click |
| `--dwc-scale-press-deep` | 0.93 | 7% shrink |
