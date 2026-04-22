# Anti-Patterns & Validation Rules

Common mistakes when wrapping Custom Elements and a checklist to verify
wrapper correctness.

## Anti-Patterns

### 1. Tag in super()

```java
// WRONG
public MyComp() { super("my-tag"); }

// CORRECT — tag via annotation, empty super()
@NodeName("my-tag")
public class MyComp extends ElementComposite {
  public MyComp() { super(); }
}
```

### 2. HasComponents with type parameter

```java
// WRONG
implements HasComponents<MyComp>

// CORRECT — HasComponents is the ONLY concern without a type param
implements HasComponents
```

### 3. Using resources without verifying they exist

```java
// WRONG — referencing files without checking they were actually downloaded
@JavaScript(value = "ws://libs/my-lib/my-lib.js",
    attributes = {@Attribute(name = "type", value = "module")})
// but src/main/resources/static/libs/my-lib/my-lib.js does not exist!

// CORRECT — download first, verify files are on disk, then reference
@JavaScript(value = "ws://libs/my-lib/my-lib.js",
    attributes = {@Attribute(name = "type", value = "module")})
```

After copying, run `grep -E "url\(|@font-face|@import"` on the CSS files
to find dependent assets (fonts, images, other CSS). Copy every referenced
file preserving relative paths, then `ls -R` to confirm. Missing fonts
cause broken icons and layout jumps.

### 4. Missing type=module on @JavaScript

```java
// WRONG — ES module won't load
@JavaScript("ws://libs/my-comp/my-comp.js")

// CORRECT
@JavaScript(value = "ws://libs/my-comp/my-comp.js",
    attributes = {@Attribute(name = "type", value = "module")})
```

### 4. Direct field access instead of PropertyDescriptor

```java
// WRONG
this.open = true;

// CORRECT
set(openProp, true);
```

### 5. Void setters

```java
// WRONG
public void setVariant(Variant v) { set(variantProp, v); }

// CORRECT — fluent chaining
public MyComp setVariant(Variant v) { set(variantProp, v); return this; }
```

### 6. get prefix on boolean getter

```java
// WRONG
public boolean getOpen() { return get(openProp); }

// CORRECT — is prefix for booleans (required by PropertyDescriptorTester)
public boolean isOpen() { return get(openProp); }
```

### 7. Stub focus/method implementations

```java
// WRONG
public void focus() {}

// CORRECT — delegate to JS
public void focus() { getElement().callJsFunctionVoidAsync("focus"); }
```

### 8. Inline slot strings

```java
// WRONG
getElement().add("header", comp);

// CORRECT — constant + typed method
private static final String HEADER_SLOT = "header";
public MyComp addToHeader(Component... comps) {
  getElement().add(HEADER_SLOT, comps);
  return this;
}
```

### 9. getBoundComponent() instead of getElement()

```java
// WRONG — getBoundComponent() is for concern interface internals
getBoundComponent().add(comp);

// CORRECT
getElement().add(SLOT, comp);
```

### 10. String descriptor for enum values

```java
// WRONG
PropertyDescriptor<String> variantProp = PropertyDescriptor.property("variant", "primary");
// ... setVariant(variant.getValue())

// CORRECT — type-safe with @SerializedName
public enum Variant {
  @SerializedName("primary") PRIMARY,
  @SerializedName("success") SUCCESS;
}
PropertyDescriptor<Variant> variantProp = PropertyDescriptor.property("variant", Variant.PRIMARY);
```

### 11. ElementComposite + HasComponents for slotted components

```java
// WRONG — manual composition
extends ElementComposite implements HasComponents

// CORRECT — Container already includes HasComponents
extends ElementCompositeContainer
```

### 12. Nested static event class

```java
// WRONG — event nested inside component
public class MyComp extends ElementComposite {
  public static class ClickEvent extends ComponentEvent<MyComp> { ... }
}

// CORRECT — standalone file in event/ sub-package
// file: event/ClickEvent.java
@EventName("my-click")
@EventOptions(filter = "event.target.isSameNode(component)")
public class ClickEvent extends ComponentEvent<MyComp> { ... }
```

### 13. Dispatching events from property setters (JS side)

```js
// WRONG — fires on programmatic changes too
set value(v) {
  this._value = v;
  this.dispatchEvent(new CustomEvent("value-changed", { ... }));
}

// CORRECT — events only from user interaction handlers
set value(v) { this._value = v; }
_onUserInput(v) {
  this._value = v;
  this.dispatchEvent(new CustomEvent("value-changed", {
    detail: { value: v }, bubbles: true, composed: true
  }));
}
```

### 14. Section separator comments

```java
// WRONG — clutters the code
// -- Properties --
// -- Events --
// ── Layout ──────────────────────────────────────────────────────

// CORRECT — no separators, code structure speaks for itself
```

### 15. Map<String, Object> for structured data

```java
// WRONG — untyped, no compile-time safety
PropertyDescriptor<List<Map<String, Object>>> columnsProp =
    PropertyDescriptor.property("columns", List.of());
kanban.addTask(Map.of("id", 1, "text", "Fix bug", "status", "toDo"));

// CORRECT — model as Java beans, Gson serializes to JSON
PropertyDescriptor<List<GridColumn>> columnsProp =
    PropertyDescriptor.property("columns", List.of());
kanban.addTask(new GridRow(1, "Fix bug", "toDo"));
```

### 16. Missing JavaDoc

```java
// WRONG — no documentation
public Kanban setEditable(boolean editable) { ... }

// CORRECT — JavaDoc pulled from the component's documentation
/**
 * Sets whether tasks can be edited inline.
 *
 * @param editable {@code true} to allow inline editing
 * @return this component for fluent chaining
 */
public Kanban setEditable(boolean editable) { ... }
```

## Validation Checklist

Verify every wrapper satisfies all of these:

1. `@NodeName` on class, `super()` with zero args
2. `@JavaScript` has `@Attribute(name = "type", value = "module")`
3. PropertyDescriptor names match web component property/attribute
4. All setters return `this`, boolean getters use `is` prefix
5. `HasComponents` never takes a type parameter
6. Slotted components extend `ElementCompositeContainer`
7. Every event extends `ComponentEvent<T>` with `@EventName("event-name")`
8. Event classes live in `event/` sub-package as standalone files
9. Events provide BOTH `addXxxListener()` AND `onXxx()` convenience alias
10. `@EventOptions(filter = "event.target.isSameNode(component)")` on events
11. Enum properties use `PropertyDescriptor<EnumType>` with `@SerializedName`
12. All slot/element access uses `getElement()`, not `getBoundComponent()`
13. JS interop prefers async: `executeJsAsync()`, `callJsFunctionAsync()`
14. Named slots use `private static final String` constants
15. Package-private `getOriginalElement()` method for testing
16. JS Custom Elements dispatch events only from user interaction, never from setters
17. Resources preferably downloaded locally to `ws://libs/`, files verified on disk before use
18. Complex properties modeled as Java beans, not `Map<String, Object>`
19. JavaDoc on class and every public method, sourced from component docs
20. No section separator comments (`// --- Properties ---`, etc.)
21. Wrapper lives in a dedicated sub-package: `components/{component}/`
