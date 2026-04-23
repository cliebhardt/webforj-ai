# Themes

## Global Token Overrides

**`resources/static/css/app.css`:**

```css
:root {
  --dwc-color-primary-h: 210;
  --dwc-color-primary-s: 80%;
  --dwc-font-family: "Inter", "Segoe UI", sans-serif;
}
```

```java
@StyleSheet("ws://css/app.css")
public class MyApp extends App { }
```

## Simple Palette Reskin (two tokens per palette)

Override just `-h` and `-s`. All shades, semantic tokens, text contrast,
borders, and focus rings recalculate automatically via OKLCH.

```css
:root {
  --dwc-color-primary-h: 211;
  --dwc-color-primary-s: 87%;

  --dwc-color-success-h: 150;
  --dwc-color-success-s: 87%;

  --dwc-color-danger-h: 345;
  --dwc-color-danger-s: 87%;

  --dwc-color-warning-h: 60;
  --dwc-color-warning-s: 87%;

  --dwc-color-info-h: 359;
  --dwc-color-info-s: 87%;

  --dwc-color-default-h: var(--dwc-color-primary-h);
  --dwc-color-default-s: 10%;
}
```

This is all you need for a color reskin. Works in light, dark, and dark-pure.

## Seed Override (any CSS color)

Instead of `-h` / `-s`, provide a direct color. The engine extracts hue/chroma via OKLCH:

```css
:root {
  --dwc-color-primary-seed: #6366f1;
  --dwc-color-success-seed: oklch(0.65 0.2 153);
  --dwc-color-danger-seed: rgb(239, 68, 68);
}
```

Accepts any CSS color: hex, rgb, hsl, oklch, lab, etc. Overrides `-h` and `-s` when set.

## Creating Custom Themes

```css
html[data-app-theme='custom-name'] {
  --dwc-color-primary-h: 280;
  --dwc-color-primary-s: 100%;
}

/* For dark themes */
html[data-app-theme='custom-dark'] {
  --dwc-dark-mode: 1;
  color-scheme: dark;
  --dwc-color-primary-h: 280;
  --dwc-color-primary-s: 100%;
}
```

## Full Production Theme

For precise control over which shades map to semantic states, remap semantic tokens to specific shade numbers.

### Palette config + semantic remapping

```css
:root {
  --dwc-color-primary-h: 211;
  --dwc-color-primary-s: 87%;

  /* Remap semantic tokens to specific shades */
  --dwc-color-primary-dark: var(--dwc-color-primary-20);
  --dwc-color-on-primary-text-dark: var(--dwc-color-primary-text-20);
  --dwc-color-primary: var(--dwc-color-primary-25);
  --dwc-color-on-primary-text: var(--dwc-color-primary-text-25);
  --dwc-color-primary-light: var(--dwc-color-primary-30);
  --dwc-color-on-primary-text-light: var(--dwc-color-primary-text-30);
}
```

### Dark mode text readability

Dark backgrounds need different shade mappings for readable text. This is
the **only** valid use of theme-specific selectors:

```css
html[data-app-theme~='dark'],
html[data-app-theme~='dark-pure'] {
  --dwc-color-primary-text-dark: var(--dwc-color-primary-30);
  --dwc-color-primary-text: var(--dwc-color-primary-35);
  --dwc-color-primary-text-light: var(--dwc-color-primary-40);
}

html[data-app-theme~='dark-pure'] {
  --dwc-color-default-s: 0%;
}
```

### What each section does

| Section | Purpose | When to use |
|---------|---------|-------------|
| Palette `-h`/`-s` | Sets the base hue and saturation for each palette | Always — this is the foundation |
| Seed override | Direct color input, engine extracts hue/chroma | When you have exact brand colors |
| Semantic remapping | Maps `-dark`/normal/`-light` to specific shade numbers | When you want precise control over button/link colors |
| On-text remapping | Pairs each semantic token with its contrast text | Always include alongside semantic remapping |
| Text color tokens | Controls text rendered in palette colors (links, labels) | When default text shades don't look right |
| Dark mode text | Adjusts text shades for dark backgrounds | When text is hard to read in dark theme |

### Rules

- Every value references a `var(--dwc-color-*)` shade token — never hardcode
- Shade numbers are always multiples of 5
- The `dark` and `dark-pure` selectors use `~=` (contains) not `=`
- Only remap tokens you need — the system has sensible defaults
- **`-c` does not exist** — text contrast is automatic via OKLCH
