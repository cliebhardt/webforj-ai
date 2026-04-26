# Table Styling in webforJ

`dwc-table` has **zero CSS custom properties**. It differs from other DWC
components — there are no `--dwc-table-*` variables to set.

## Sizing is Java-only

Row height, header height, and borders are controlled by Java API — not
CSS. Do not set sizing properties on table parts.

```java
table.setRowHeight(40);
table.setHeaderHeight(48);
table.setStriped(true);
table.setBordersVisible(EnumSet.of(
    Table.Border.ROWS, Table.Border.COLUMNS, Table.Border.AROUND));
```

## What you CAN style via CSS

### Visual styling via `::part()`

The table exposes many shadow parts for visual customization (colors,
backgrounds, borders, fonts, etc.).

**Avoid on table parts:** `height`, `padding`, `margin`, `min-height`,
`max-height`, `line-height`, `width` — sizing is managed by the Java API.

For the complete list of parts on `dwc-table` for the resolved
`webforjVersion`, call:

```
webforj-mcp:styles_get_component
  webforjVersion: <resolved>
  reasoning: <why>
  name: dwc-table
```

The response lists every part name, CSS variable, slot, and reflected
attribute the component exposes for that version. Do not assume part
names from memory; the catalog can change between major versions.

### Borders and stripes via Java

```java
table.setStriped(true);
table.setBordersVisible(EnumSet.of(
    Table.Border.ROWS,
    Table.Border.COLUMNS,
    Table.Border.AROUND
));
```

These set reflected attributes (`[striped]`, `[border]`, `[rows-border]`,
`[columns-border]`) that the internal CSS responds to. Use the Java API —
don't recreate border logic in CSS.

### Dynamic row/cell styling via part providers

The table supports custom part names assigned per-row or per-cell from
Java. These are the recommended way to do conditional styling.

```java
table.setRowPartProvider(item -> {
    if (item.getStatus().equals("overdue"))
        return List.of("row-overdue");
    return List.of();
});
```

```css
dwc-table::part(row-overdue) {
  background: var(--dwc-color-danger-alt);
  color: var(--dwc-color-danger-text);
}
```

### Prefer global tokens over `::part()`

The table inherits from global DWC tokens — surfaces, palette colors,
spacing, fonts. Overriding these at `:root` changes the table
automatically without any `::part()` rules. Only use `::part()` when
you need to style a specific part differently from the global tokens.
