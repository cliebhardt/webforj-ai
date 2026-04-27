# Form Layout with `ColumnsLayout`

`ColumnsLayout` is a responsive multi-column grid that adapts to its parent's width. By default it shows two columns and fills the parent.

```java
import com.webforj.component.layout.columnslayout.ColumnsLayout;

ColumnsLayout layout = new ColumnsLayout(firstName, lastName, email,
    password, passwordConfirm, address, states, zip, cancel, submit);
```

For a vertical stack with no responsive logic, `FlexLayout` is simpler and lighter.

## Breakpoints

A `Breakpoint` declares "at this minimum width or wider, use this many columns". Breakpoints are evaluated in ascending order; the first match wins.

Declare them in the constructor along with the components:

```java
private final ColumnsLayout columnsLayout = new ColumnsLayout(
    List.of(
        new ColumnsLayout.Breakpoint("default", 0, 1),
        new ColumnsLayout.Breakpoint("small", "20em", 1),
        new ColumnsLayout.Breakpoint("medium", "40em", 2),
        new ColumnsLayout.Breakpoint("large", "60em", 3)),
    firstName, lastName, email, password, confirmPassword);
```

Or set them later with `setBreakpoints(...)`:

```java
ColumnsLayout layout = new ColumnsLayout();
layout.setBreakpoints(List.of(
    new ColumnsLayout.Breakpoint(0, 1),         // 1 column at widths >= 0
    new ColumnsLayout.Breakpoint(600, 2),       // 2 columns at widths >= 600px
    new ColumnsLayout.Breakpoint(1200, 4)));    // 4 columns at widths >= 1200px
```

A `Breakpoint` is a record with four constructor forms:

| Form | Use |
|---|---|
| `(int minWidth, int columns)` | Anonymous, integer pixel width |
| `(String minWidth, int columns)` | Anonymous, CSS-unit width like `"40em"` |
| `(String name, int minWidth, int columns)` | Named, integer pixels |
| `(String name, String minWidth, int columns)` | Named, CSS-unit width |

A name is required when you later refer to the breakpoint with `setSpan(component, "name", n)` or `setColumn(component, "name", n)`. CSS-unit widths accept `em`, `vw`, `%`, etc.

## Spans

By default each item occupies one column. To make an item span multiple:

```java
layout.setSpan(button, 2);                     // span 2 columns at the active breakpoint
```

Per-breakpoint:

```java
layout.setSpan(email, "medium", 2);            // 2 columns when "medium" is active
```

This is the documented way to make an "Email" or "Address" field run full-width while smaller fields stay paired.

## Column placement

By default items fill left-to-right. Override:

```java
layout.setColumn(button, 2);                   // place in column 2 at the active breakpoint
layout.setColumn(email, "medium", 2);          // column 2 only when "medium" is active
```

Useful for reordering on small screens or aligning a "Submit" button to the right.

## Alignment

Each item can be aligned within its column. Aligning a Submit button to the end of its column:

```java
columnsLayout.setSpan(bio, 2)
    .setSpan(terms, 2)
    .setColumn(submit, 2)
    .setHorizontalAlignment(submit, ColumnsLayout.Alignment.END)
    .setStyle("padding", "var(--dwc-space-xl)");
```

`Alignment` values from `ColumnsLayout.Alignment`: `START`, `CENTER`, `END`, `STRETCH`, `BASELINE`, `AUTO`.

`setVerticalAlignment(component, Alignment)` works the same way. Use it when columns have varying heights and you want to control how items line up vertically.

## Spacing

```java
layout.setHorizontalSpacing(20);               // 20px between columns
layout.setVerticalSpacing(15);                 // 15px between rows
// or string units
layout.setHorizontalSpacing("var(--dwc-space-l)");
```

## Avoid collisions

When mixing spans and explicit column placements, the row's combined spans + placements must not overlap. The framework does its best to gracefully reflow, but careful design avoids unintended overlaps, in particular, when an item with `span=2` is paired with another item placed in the same row.

## Canonical form recipe

A typical sign-up form:

```java
TextField firstName = new TextField("First Name");
TextField lastName  = new TextField("Last Name");
TextField email     = new TextField("Email");
PasswordField password        = new PasswordField("Password");
PasswordField passwordConfirm = new PasswordField("Confirm Password");
TextField address   = new TextField("Address");
ChoiceBox states    = new ChoiceBox("State");
TextField zip       = new TextField("Zip");
Button submit = new Button("Submit", ButtonTheme.PRIMARY);
Button cancel = new Button("Cancel", ButtonTheme.OUTLINED_PRIMARY);

ColumnsLayout layout = new ColumnsLayout(
    firstName, lastName,
    email,
    password, passwordConfirm,
    address,
    states, zip,
    cancel, submit);

// Make email and address span both columns
layout.setSpan(email, 2)
      .setSpan(address, 2)
      .setStyle("padding", "var(--dwc-space-xl)");
```

Default behavior (two columns) gives `firstName | lastName`, `password | passwordConfirm`, `states | zip`, `cancel | submit`. The `setSpan(..., 2)` on `email` and `address` pushes them onto their own row.

Layout choice cheat-sheet:

| Need | Choose |
|---|---|
| Stack of fields, all full width | `FlexLayout` (vertical) |
| Two-column form that goes single column on mobile | `ColumnsLayout` with `Breakpoint(0, 1)` and `Breakpoint("medium", "40em", 2)` |
| Three-column dashboard-style metrics | `ColumnsLayout` with three breakpoints |
| Buttons row at the end of a form | `ColumnsLayout` (place buttons in last row) or a horizontal `FlexLayout` inside one column |
