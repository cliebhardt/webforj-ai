# Composing webforJ Components

Combine existing webforJ components into a new reusable component using
`Composite<T>`. No JavaScript needed.

## When to Use

- Building a component from existing webforJ components (TextField, Button,
  ColorField, etc.)
- Creating reusable business logic units (forms, cards, dashboards)
- Grouping related components with a clean public API

## Pattern

```java
public class ColorInput extends Composite<FlexLayout>
    implements HasValue<ColorInput, String>, HasLabel<ColorInput> {

  private final FlexLayout self = getBoundComponent();
  private final TextField textField = new TextField();
  private final ColorField chooser = new ColorField();

  public ColorInput() {
    self.setSpacing("8px")
        .setAlignment(FlexAlignment.CENTER);
    textField.addSuffix(chooser);
    self.add(textField);

    // Sync chooser -> textField
    chooser.addValueChangeListener(e ->
        textField.setValue(e.getValue()));
    // Sync textField -> chooser
    textField.addValueChangeListener(e ->
        chooser.setValue(e.getValue()));
  }

  @Override
  public ColorInput setValue(String value) {
    textField.setValue(value);
    return this;
  }

  @Override
  public String getValue() {
    return textField.getValue();
  }

  @Override
  public ColorInput setLabel(String label) {
    textField.setLabel(label);
    return this;
  }

  @Override
  public String getLabel() {
    return textField.getLabel();
  }
}
```

## Key Concepts

### Composite\<T\>

`T` is the **bound component** — the root container that holds everything.
Typical choices:

| Bound component | When to use |
|---|---|
| `FlexLayout` | Most cases — flexible row/column layout |
| `Div` | Simple container, no layout opinions |
| Any webforJ component | Wrapping a single component with a restricted API |

Access the bound component via `getBoundComponent()` or store it as a field:

```java
private final FlexLayout self = getBoundComponent();
```

Override `initBoundComponent()` when you need a parameterized constructor:

```java
@Override
protected FlexLayout initBoundComponent() {
  return new FlexLayout(nameField, emailField, submitButton);
}
```

### Concern Interfaces

Concern interfaces add capabilities to your composite without writing
implementation code — they provide default implementations that automatically
delegate to the bound component.

| Interface | What it adds |
|---|---|
| `HasValue<T, V>` | `getValue()`, `setValue()` — must implement manually (delegate to inner component) |
| `HasLabel<T>` | `getLabel()`, `setLabel()` — must implement manually (delegate to inner component) |
| `HasSize<T>` | `setWidth()`, `setHeight()` — auto-delegates to bound component |
| `HasClassName<T>` | `addClassName()`, `removeClassName()` — auto-delegates |
| `HasStyle<T>` | `setStyle()` — auto-delegates |
| `HasVisibility<T>` | `setVisible()` — auto-delegates |
| `HasFocus<T>` | `focus()` — auto-delegates |
| `HasEnablement<T>` | `setEnabled()` — auto-delegates |

Full list: [com.webforj.concern](https://javadoc.io/doc/com.webforj/webforj-foundation/latest/com/webforj/concern/package-summary.html)

**Auto-delegating** interfaces (HasSize, HasClassName, etc.) just work — add
them to `implements` and you're done.

**Manual-delegation** interfaces (HasValue, HasLabel) require you to override
the methods and forward to the appropriate inner component.

### Delegation Pattern

The composite's public API delegates to inner components:

```java
// The composite IS NOT a TextField — it HAS a TextField
public class SearchBar extends Composite<FlexLayout>
    implements HasValue<SearchBar, String>, HasLabel<SearchBar> {

  private final TextField searchField = new TextField();
  private final Button searchButton = new Button("Search");

  // Delegate value to the inner TextField
  @Override
  public String getValue() { return searchField.getValue(); }

  @Override
  public SearchBar setValue(String value) {
    searchField.setValue(value);
    return this;
  }

  // Delegate label to the inner TextField
  @Override
  public String getLabel() { return searchField.getLabel(); }

  @Override
  public SearchBar setLabel(String label) {
    searchField.setLabel(label);
    return this;
  }
}
```

### Events

Forward events from inner components or dispatch your own:

```java
// Forward inner component's event
public ListenerRegistration<ValueChangeEvent<String>> addValueChangeListener(
    EventListener<ValueChangeEvent<String>> listener) {
  return textField.addValueChangeListener(listener);
}

// Dispatch via EventDispatcher
private final EventDispatcher dispatcher = new EventDispatcher();

public ListenerRegistration<SearchEvent> onSearch(
    EventListener<SearchEvent> listener) {
  return dispatcher.addListener(SearchEvent.class, listener);
}
```

## Rules

- **Never extend `Component` or `DwcComponent` directly** — always use
  `Composite<T>`
- **Use `getBoundComponent()`** to access the root container — not `this`
- **Setters return `this`** for fluent chaining (same as ElementComposite)
- **Keep internals private** — only expose what users need via public methods
  and concern interfaces
- **Constructor does the work** — add children, set up layout, register events
  in the constructor
