# PropertyDescriptor Patterns

## Declaration

```java
private final PropertyDescriptor<String> labelProp =
    PropertyDescriptor.property("label", "");
```

- `property("name", default)` — maps to a JS property (camelCase)
- `attribute("name", default)` — maps to an HTML attribute (kebab-case)
- Naming convention: `private final`, camelCase with `Prop` suffix

## Supported Types

Any Java object works as a `PropertyDescriptor` type. webforJ serializes values
to JSON via Gson before sending them to the client.

**Common types:** `String`, `Boolean`, `Integer`, `Double`, `Map`, `List`,
enums (with `@SerializedName`), and any custom POJO.

```java
// Primitives and standard types
PropertyDescriptor<String>  labelProp    = PropertyDescriptor.property("label", "");
PropertyDescriptor<Boolean> disabledProp = PropertyDescriptor.property("disabled", false);
PropertyDescriptor<Integer> countProp    = PropertyDescriptor.property("count", 0);
PropertyDescriptor<Double>  opacityProp  = PropertyDescriptor.property("opacity", 1.0);

// Custom POJOs — Gson-serialized to JSON (preferred for structured data)
PropertyDescriptor<List<GridColumn>> columnsProp =
    PropertyDescriptor.property("columns", List.of());
PropertyDescriptor<ChartOptions> optionsProp =
    PropertyDescriptor.property("options", new ChartOptions());

// Enums — with @SerializedName (see Enum Pattern below)
PropertyDescriptor<Variant> variantProp =
    PropertyDescriptor.property("variant", Variant.PRIMARY);
```

Since Gson handles the serialization, any object with public fields or standard
getter/setter conventions will work. Use `@SerializedName` on fields or enum
constants to control the JSON key names.

## Modeling Complex Properties

When a web component property expects an array of objects or a structured object,
**always model it as a Java bean** — never use `Map<String, Object>`. Gson
serializes POJOs to JSON automatically, giving you type safety and clean APIs.

```java
// CORRECT — typed bean
public class GridColumn {
  @SerializedName("label")
  private String label;
  @SerializedName("dataField")
  private String dataField;

  public GridColumn(String label, String dataField) {
    this.label = label;
    this.dataField = dataField;
  }
  // getters...
}

PropertyDescriptor<List<GridColumn>> columnsProp =
    PropertyDescriptor.property("columns", List.of());

// WRONG — untyped map, no compile-time safety
PropertyDescriptor<List<Map<String, Object>>> columnsProp =
    PropertyDescriptor.property("columns", List.of());
```

## Enum Pattern

`@SerializedName` (Gson) controls the JSON value sent to the web component —
e.g. `@SerializedName("primary") PRIMARY` means Java's `PRIMARY` becomes
`"primary"` in the browser. Use `PropertyDescriptor<EnumType>` directly.
Never use `PropertyDescriptor<String>` with manual `.getValue()` extraction.

```java
// CORRECT
public enum Variant {
  @SerializedName("primary") PRIMARY,
  @SerializedName("success") SUCCESS,
  @SerializedName("danger") DANGER;
}

private final PropertyDescriptor<Variant> variantProp =
    PropertyDescriptor.property("variant", Variant.PRIMARY);

public Variant getVariant() { return get(variantProp); }
public MyComp setVariant(Variant variant) { set(variantProp, variant); return this; }

// WRONG — manual string extraction
private final PropertyDescriptor<String> variantProp =
    PropertyDescriptor.property("variant", "primary");
```

## Getters and Setters

**Setters** always return `this` for fluent chaining:

```java
public MyComp setLabel(String label) {
  set(labelProp, label);
  return this;
}
```

**Boolean getters** use `is` prefix (required for PropertyDescriptorTester):

```java
private final PropertyDescriptor<Boolean> disabledProp =
    PropertyDescriptor.property("disabled", false);

public boolean isDisabled() { return get(disabledProp); }
public MyComp setDisabled(boolean disabled) { set(disabledProp, disabled); return this; }
```

**Non-boolean getters** use `get` prefix:

```java
public String getLabel() { return get(labelProp); }
public Variant getVariant() { return get(variantProp); }
```

## Reading from Client

```java
// Standard — reads from server-side state
get(labelProp);

// Force client fetch — reads live value from browser DOM
get(labelProp, true, String.class);
```

## Annotations

- `@PropertyExclude` — skip this descriptor in PropertyDescriptorTester
  (for properties needing special handling, e.g., client-side-only state)
- `@PropertyMethods(getter = "customGet", setter = "customSet")` — custom
  getter/setter names, or `targetClass` for inherited descriptors

## CSS Custom Properties

For web component CSS custom properties, use `setStyle()`:

```java
public MyComp setTrackColor(String color) {
  setStyle("--my-comp-track-color", color);
  return this;
}
```
