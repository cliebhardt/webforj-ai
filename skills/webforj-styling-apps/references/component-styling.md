# Component Styling

## Shadow Parts

```css
dwc-button::part(label) {
  font-weight: 600;
  text-transform: uppercase;
}

dwc-button::part(label):hover {
  color: var(--dwc-color-primary-light);
}

dwc-button::part(control) {
  background: linear-gradient(135deg,
    var(--dwc-color-primary),
    var(--dwc-color-primary-dark));
}
```

What does NOT work:

```css
/* Can't cross shadow DOM with regular selectors */
dwc-button .control__label { color: pink; }

/* Can't select descendants inside a part */
dwc-button::part(label) span { ... }
```

## Component CSS Variables

```css
dwc-button:not([theme]) {
  --dwc-button-font-weight: 400;
}

dwc-button[theme~="primary"] {
  --dwc-button-font-weight: 700;
}

dwc-button[disabled] {
  opacity: var(--dwc-disabled-opacity);
}
```

Java equivalent:

```java
button.setStyle("--dwc-button-font-weight", "700");
```

## Reflected Attributes: `theme` and `expanse`

Components expose reflected attributes (listed in the script output under
"Reflected Attributes"). The shadow DOM uses `:host([attr='...'])` internally
to apply variant-specific styles. External styles on the host element beat
`:host([attr])`, so bare tag selectors override ALL variants at once.

**`theme`** — color variant (primary, success, outlined-primary, etc.).
Sets backgrounds, text colors, borders, focus rings.

**`expanse`** — size variant (`xs`, `s`, `m`, `l`, `xl`).
Maps to `--dwc-font-size-{size}`, `--dwc-size-{size}`, `--dwc-space-{size}`.

```css
/* WRONG — overrides every theme/expanse variant */
dwc-button { --dwc-button-color: gray; }

/* CORRECT — only affects unthemed instances */
dwc-button:not([theme]) { --dwc-button-color: gray; }

/* CORRECT — target a specific variant */
dwc-button[theme~="primary"] { --dwc-button-background: ...; }
dwc-button[expanse="l"] { --dwc-button-font-weight: 700; }
```

When the script lists `theme` or `expanse`, scope CSS variable overrides
with `:not([theme])`, `:not([expanse])`, or target specific variants.

## Java-Side Styling

```java
public class UserForm extends Composite<FlexLayout> {
  private FlexLayout self = getBoundComponent();

  public UserForm() {
    TextField nameField = new TextField("Name");
    Button saveButton = new Button("Save", ButtonTheme.PRIMARY);

    self.setDirection(FlexDirection.COLUMN)
      .setSpacing("var(--dwc-space-m)")
      .add(nameField, saveButton);

    saveButton.setStyle("--dwc-font-size", "var(--dwc-font-size-m)");
    self.addClassName("user-form");
  }
}
```

## Scoped Token Overrides

```css
dwc-button {
  --dwc-font-size: var(--dwc-font-size-m);
}

dwc-field {
  --dwc-font-size: var(--dwc-font-size-s);
}
```

## Table Row/Cell Styling

`setRowPartProvider` returns `List<String>` of CSS part names per row.
`setCellPartProvider` takes the item and a `Column` object, returns `List<String>`.

```java
Column<Order, Double> amountColumn = table.addColumn("Amount", Order::getAmount);

table.setRowPartProvider(item -> {
  if (item.getStatus().equals("overdue")) return List.of("row-overdue");
  return List.of();
});

table.setCellPartProvider((item, column) -> {
  if (column == amountColumn && item.getAmount() < 0) return List.of("cell-negative");
  return List.of();
});
```

```css
dwc-table::part(row-overdue) {
  background: var(--dwc-color-danger-95);
}

dwc-table::part(cell-negative) {
  color: var(--dwc-color-danger);
  font-weight: var(--dwc-font-weight-semibold);
}
```

## Table Renderer Parts

Column renderers output HTML templates. Add `part` attributes to rendered
elements — they become styleable with `::part()` like any other component part.

```java
class AvatarRenderer extends Renderer<MusicRecord> {
  @Override
  public String build() {
    return """
        <div part='avatar-renderer'>
          <img part='avatar-img'
            src='https://i.pravatar.cc/32?u=<%= encodeURIComponent(cell.row.getValue("Artist")) %>' />
          <div part="avatar-text">
            <%= cell.row.getValue("Title") %>
            <div part="avatar-subtext"><%= cell.row.getValue("Artist") %></div>
          </div>
        </div>
        """;
  }
}

class BadgeRenderer extends Renderer<MusicRecord> {
  @Override
  public String build() {
    return """
        <span part='badge badge-<%= cell.value > 7 ? "high" : "low" %>'>
          <%= cell.value %>
        </span>
        """;
  }
}
```

Style the rendered parts with `::part()`:

```css
dwc-table::part(avatar-renderer) {
  display: flex;
  align-items: center;
  gap: var(--dwc-space-s);
}

dwc-table::part(avatar-img) {
  border-radius: var(--dwc-border-radius-round);
}

dwc-table::part(badge) {
  padding: var(--dwc-space-2xs) var(--dwc-space-s);
  border-radius: var(--dwc-border-radius-s);
}

dwc-table::part(badge-high) {
  background: var(--dwc-color-success-90);
  color: var(--dwc-color-success-text);
}

dwc-table::part(badge-low) {
  background: var(--dwc-color-danger-90);
  color: var(--dwc-color-danger-text);
}
```

## Ripple Effect

Interactive components use a pure-CSS ripple on `:active`. The ripple is a
`::after` pseudo-element with a radial gradient that scales on click.

Components with ripple: `dwc-button` (control + dropdown), `dwc-icon-button`,
`dwc-alert` (close button), `dwc-menuitem`, `dwc-listbox` (items),
`dwc-color-chooser` (swatches), `dwc-navigator` (buttons).

### Customizing

```css
/* Change ripple color globally */
:root {
  --dwc-ripple-color: var(--dwc-color-primary);
}

/* Change ripple color per component */
dwc-button {
  --dwc-ripple-color: var(--dwc-color-info);
}
```

The ripple speed uses transition tokens: `--dwc-transition-fast` (transform),
`--dwc-transition-x-slow` (opacity), `--dwc-transition-slow` (filter blur).

### Disabling

The ripple lives on the `::after` pseudo-element of the part that includes it.
Hide it by targeting the part's `::after`:

```css
/* Disable ripple on all buttons */
dwc-button::part(control)::after {
  display: none;
}

/* Disable ripple on a specific component */
dwc-icon-button::part(control)::after {
  display: none;
}

/* Disable ripple on listbox items */
dwc-listbox::part(item)::after {
  display: none;
}
```