# Color System Reference

## OKLCH Engine

The DWC theme engine uses **OKLCH color space** internally. Palette seeds are defined as HSL hue + saturation, but all 19 shades are generated via OKLCH for perceptual uniformity. No build step — CSS recalculates at runtime.

## Shade Scale

Each palette has 19 shades numbered 5 through 95 in steps of 5:

```
5  10  15  20  25  30  35  40  45  50  55  60  65  70  75  80  85  90  95
```

- Step 5 = always darkest (3% OKLCH lightness)
- Step 95 = always lightest (99% OKLCH lightness)
- Lightness is **absolute** — steps do NOT invert in dark mode

Token pattern: `--dwc-color-{palette}-{shade}`

```css
--dwc-color-primary-5    /* very dark */
--dwc-color-primary-50   /* mid */
--dwc-color-primary-95   /* very light */
```

### Chroma curve

Each step has a bell-shaped chroma multiplier (0.1–1.0, peak at mid-lightness). This follows natural sRGB gamut boundaries — extreme light/dark steps are less saturated.

### Hue rotation

`--dwc-color-hue-rotate` (default: 3 degrees) shifts hue across the scale — darker steps shift warm (+1 at step 5), lighter shift cool (-1 at step 95). Mimics natural pigment behavior. Set to `0` to disable.

## Text on Shade Backgrounds

Two categories of text tokens:

### Surface-safe text (`-text-{shade}`)

Colored text safe on neutral surfaces (body, panels):

```
--dwc-color-{palette}-text-{shade}
```

Light mode caps lightness at 44%, dark mode floors at 75%. WCAG AA guaranteed.

### On-palette text (`on-{palette}-text-{shade}`)

Contrast text for use directly ON a shade as background:

```
--dwc-color-on-{palette}-text-{shade}
```

Automatically flips between light/dark at OKLCH 0.59 threshold. Preserves subtle color tint (not pure black/white).

Always pair backgrounds with matching text:

```css
background: var(--dwc-color-primary-30);
color: var(--dwc-color-on-primary-text-30);
```

## Semantic Tokens

| Token | Use |
|-------|-----|
| `--dwc-color-{palette}` | Default button/link color |
| `--dwc-color-{palette}-dark` | `:active`, selected rows |
| `--dwc-color-{palette}-light` | `:hover`, `:focus-visible` |
| `--dwc-color-{palette}-alt` | Badges, tags, subtle accents |
| `--dwc-color-{palette}-tint` | Seed at 12% opacity (subtle alt bg) |
| `--dwc-color-{palette}-text` | Label text on colored background |
| `--dwc-color-{palette}-text-dark` | Text on active state |
| `--dwc-color-{palette}-text-light` | Text on hover state |
| `--dwc-color-{palette}-text-alt` | Text on alt state |

## On-Text Tokens

When using a `{palette}-text` color as a **background** (inverted UI), use on-text tokens for the foreground:

| Token | Description |
|-------|-------------|
| `--dwc-color-on-{palette}-text` | Text on palette-text background |
| `--dwc-color-on-{palette}-text-dark` | Dark variant |
| `--dwc-color-on-{palette}-text-light` | Light variant |
| `--dwc-color-on-{palette}-text-alt` | Alt variant |

```css
.badge-inverted {
  background: var(--dwc-color-primary-text);
  color: var(--dwc-color-on-primary-text);
}
```

## Border and Focus Ring

```css
/* Border color per palette (two variants) */
border: var(--dwc-border-width) var(--dwc-border-style) var(--dwc-border-color-primary);
border: var(--dwc-border-width) var(--dwc-border-style) var(--dwc-border-color-primary-emphasis);
```

Focus ring uses a gap pattern (double box-shadow):

| Token | Default | Description |
|-------|---------|-------------|
| `--dwc-focus-ring-a` | `0.75` | Alpha |
| `--dwc-focus-ring-width` | `2px` | Ring width |
| `--dwc-focus-ring-gap` | `2px` | Gap between component and ring |

Per-palette: `--dwc-focus-ring-{palette}` — double shadow creating visible gap between component edge and ring.

## Palette Configuration

Two tokens per palette (+ optional seed):

| Token | Range | Description |
|-------|-------|-------------|
| `--dwc-color-{palette}-h` | 0–360 | Hue |
| `--dwc-color-{palette}-s` | 0%–100% | Saturation |
| `--dwc-color-{palette}-seed` | any CSS color | Direct override (hex, rgb, oklch, lab) |

**`-c` does not exist.** Text contrast is automatic via OKLCH at 0.59 lightness threshold.

When `-seed` is set, it overrides `-h` and `-s`. The engine extracts hue/chroma from the seed.

## Mode-Aware Colors

| Token | Light mode | Dark mode |
|-------|-----------|----------|
| `--dwc-color-black` | Near-black | Near-white |
| `--dwc-color-white` | Near-white | Near-black |
| `--dwc-color-body-text` | Uses black | Uses white |

These are **NOT static** — they flip with mode.

## Dark Mode Behavior

Shade lightness is **absolute** and does **not** invert:
- Step 5 is always darkest in both light and dark mode
- Step 95 is always lightest in both modes
- Mode adaptation happens in the **variations layer** (semantic tokens), not the palette itself

What adapts automatically:
- Semantic tokens (`-dark`, `-light`, `-alt`)
- Text contrast tokens (different lightness floors per mode)
- Surfaces (`--dwc-surface-1/2/3`)
- Borders, shadows, focus rings
- Black/white

Write CSS once — it works in every theme.

## Quick Reference

```
--dwc-color-{palette}-{5..95}              shade (absolute lightness)
--dwc-color-{palette}-text-{5..95}         surface-safe text on shade
--dwc-color-on-{palette}-text-{5..95}      on-palette text on shade
--dwc-color-{palette}                      semantic normal
--dwc-color-{palette}-dark                 semantic active
--dwc-color-{palette}-light                semantic hover
--dwc-color-{palette}-alt                  semantic accent
--dwc-color-{palette}-tint                 seed at 12% opacity
--dwc-color-{palette}-text                 text on normal
--dwc-color-{palette}-text-dark            text on active
--dwc-color-{palette}-text-light           text on hover
--dwc-color-{palette}-text-alt             text on alt
--dwc-color-on-{palette}-text              inverted text
--dwc-color-on-{palette}-text-dark         inverted dark
--dwc-color-on-{palette}-text-light        inverted light
--dwc-color-on-{palette}-text-alt          inverted alt
--dwc-border-color-{palette}               border color
--dwc-border-color-{palette}-emphasis      stronger border
--dwc-focus-ring-{palette}                 focus ring (gap pattern)
--dwc-color-{palette}-h                    hue config
--dwc-color-{palette}-s                    saturation config
--dwc-color-{palette}-seed                 direct color override
```

Palettes: `default`, `primary`, `success`, `warning`, `danger`, `info`, `gray`
