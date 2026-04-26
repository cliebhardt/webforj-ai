# DWC Themes

**Preference, per the skill's Hard rule 6:** always prefer overriding the built-in themes (`light` at `:root`, `dark` or `dark-pure` under their `html[data-app-theme="..."]` selector) over creating a new custom theme. Only define a custom theme when overriding the built-ins cannot express the requested behavior.

## Universal facts (DWC v1 and v2)

### Built-in app themes

```
light        bright background, default
dark         dark background tinted with the primary color
dark-pure    fully neutral dark theme based on gray tones
system       follow the OS preference
```

Apply with `@AppTheme` or `App.setTheme()`. The theme name must be one of `system`, `light`, `dark`, `dark-pure`, or a custom theme name.

```java
@AppTheme("dark-pure")
class MyApp extends App {
  // app code
}

// or programmatically
App.setTheme("dark-pure");
```

### Override the light theme

Both versions document overriding the light theme by redefining CSS custom properties at `:root`.

```css
:root {
  --dwc-color-primary-h: 215;
  --dwc-color-primary-s: 100%;
}
```

### Override built-in dark themes

Both versions use attribute selectors on the `<html>` element:

```css
html[data-app-theme="dark"] {
  --dwc-color-primary-s: 80%;
}
```

### Custom themes

Both versions define custom themes with `html[data-app-theme='THEME_NAME']`:

```css
html[data-app-theme="new-theme"] {
  --dwc-color-primary-h: 280;
  --dwc-color-primary-s: 100%;
}
```

Apply with `@AppTheme("new-theme")` or `App.setTheme("new-theme")`. Custom themes can coexist with the default ones, and can be switched dynamically at runtime.

### Component themes

Components support seven theme attributes drawn from the palettes: `default`, `primary`, `success`, `warning`, `danger`, `info`, `gray`. Each component documents its supported themes under its own **Styling → Themes** section.

## DWC v1 only

### `:root` example with `-c`

A DWC v1 `:root` override includes the contrast threshold variable:

```css
:root {
  --dwc-color-primary-h: 215;
  --dwc-color-primary-s: 100%;
  --dwc-color-primary-c: 50;
  --dwc-font-size: var(--dwc-font-size-m);
}
```

### Dark theme example

```css
html[data-app-theme="dark"] {
  --dwc-color-primary-s: 9%;
  --dwc-color-white: hsl(210, 17%, 82%);
}
```

### Custom theme with `-c`

```css
html[data-app-theme="new-theme"] {
  --dwc-color-primary-h: 280;
  --dwc-color-primary-s: 100%;
  --dwc-color-primary-c: 60;
}
```

## DWC v2 only

### `:root` example without `-c`

A DWC v2 `:root` override uses only `-h`, `-s`, and a font-size variable:

```css
:root {
  --dwc-color-primary-h: 215;
  --dwc-color-primary-s: 100%;
  --dwc-font-size: var(--dwc-font-size-l);
}
```

### Dark theme example

```css
html[data-app-theme="dark"] {
  --dwc-color-primary-s: 80%;
}
```

### Custom dark theme

To make a DWC v2 custom theme dark, set `--dwc-dark-mode: 1` and `color-scheme: dark` on the same selector:

```css
html[data-app-theme="new-dark-theme"] {
  --dwc-dark-mode: 1;
  --dwc-color-primary-h: 280;
  --dwc-color-primary-s: 100%;
  color-scheme: dark;
}
```
