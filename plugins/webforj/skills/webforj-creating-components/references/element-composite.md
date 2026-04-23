# ElementComposite & Base Classes

## Base Class Selection

| Component type | Base class |
|---|---|
| No slots | `extends ElementComposite` |
| Has default or named slots | `extends ElementCompositeContainer` |

`ElementCompositeContainer` already implements `HasComponents` — do NOT do
`extends ElementComposite implements HasComponents` for slotted components.

## @NodeName Annotation

Always declare the tag via annotation, never in super():

```java
// CORRECT
@NodeName("my-tag")
public class MyComp extends ElementComposite {
  public MyComp() { super(); }
}

// WRONG — never pass tag to super()
public class MyComp extends ElementComposite {
  public MyComp() { super("my-tag"); }
}
```

## Resource Annotations

**Prefer local** — download JS/CSS into `src/main/resources/static/libs/{library}/`
and verify the files exist before writing Java code. Self-contained, works offline.
Only use CDN as a last resort when local is impractical.

After copying CSS files, scan them for dependent assets:
`grep -E "url\(|@font-face|@import" *.css` — copy every referenced file
(fonts, images, other CSS) preserving relative paths. Then `ls -R` the
target directory to confirm everything is present before writing Java code.

```java
@JavaScript(value = "ws://libs/my-lib/my-lib.js",
    attributes = {@Attribute(name = "type", value = "module")})
@StyleSheet("ws://libs/my-lib/themes/light.css")
@NodeName("x-button")
public class XButton extends ElementCompositeContainer { }
```

`@Attribute(name = "type", value = "module")` is **required** on `@JavaScript`
for ES module scripts (virtually all modern web component libraries).

### Component-specific stylesheets

Wrappers can bundle their own CSS alongside library resources. Use a separate
`@StyleSheet` annotation pointing to a file you author. Keep it co-located
with the library assets so everything for that integration lives together:

```java
@JavaScript(value = "ws://libs/my-lib/my-lib.js",
    attributes = {@Attribute(name = "type", value = "module")})
@StyleSheet("ws://libs/my-lib/themes/light.css")      // ships with the library
@StyleSheet("ws://libs/my-lib/x-button.css")           // your own styles
@NodeName("x-button")
public class XButton extends ElementCompositeContainer { }
```

Place your CSS in `src/main/resources/static/libs/{library}/`. Co-locating
keeps all files for a given integration in one place — easy to find, copy,
or delete as a unit.

For inline CSS (small snippets, no external file):

```java
@InlineStyleSheet("x-button::part(base) { border-radius: 0; }")
```

Multiple `@StyleSheet` and `@InlineStyleSheet` annotations can be stacked.
They load once per component class (not per instance).

## Concern Interfaces

Implement to gain automatic functionality via delegation. Interfaces use default
methods + `ComponentUtil.getBoundComponent(this)` to delegate to the underlying
Element — zero boilerplate in your class.

**Core (most common for web component wrappers):**
- `HasClassName<T>` — CSS class management
- `HasStyle<T>` — inline style management
- `HasVisibility<T>` — show/hide
- `HasEnablement<T>` — enable/disable
- `HasAttribute<T>` — arbitrary HTML attributes
- `HasFocus<T>` — focus/blur management

**Content:**
- `HasText<T>` — text content
- `HasHtml<T>` — HTML content

**Form inputs:**
- `HasValue<T,V>` — value get/set with change events
- `HasLabel<T>` — label text
- `HasPlaceholder<T>` — placeholder text
- `HasHelperText<T>` — helper/description text
- `HasReadOnly<T>` — read-only state
- `HasRequired<T>` — required state
- `HasPattern<T>` — regex pattern
- `HasMin<T,V>`, `HasMax<T,V>`, `HasStep<T,V>` — numeric constraints
- `HasMinLength<T>`, `HasMaxLength<T>` — text length constraints

**Layout/sizing:**
- `HasSize<T>` — combines HasWidth, HasHeight, HasMin/MaxWidth/Height

**Slots:**
- `HasPrefix<T>`, `HasSuffix<T>`, `HasPrefixAndSuffix<T>`

**Container:**
- `HasComponents` — the ONLY one WITHOUT a type parameter

Full list: [com.webforj.concern](https://javadoc.io/doc/com.webforj/webforj-foundation/latest/com/webforj/concern/package-summary.html)

## Element Access

Always use `getElement()` to access the underlying Element:

```java
// CORRECT
getElement().add("header", headerComp);
getElement().setProperty("variant", "primary");

// WRONG — getBoundComponent() is for concern interface internals
getBoundComponent().add(headerComp);
```

## Slots

```java
// Named slot
private static final String HEADER_SLOT = "header";
getElement().add(HEADER_SLOT, component);

// Default slot
add(component);  // inherited from ElementCompositeContainer

// Query slots
getElement().getFirstComponentInSlot("header");
getElement().getComponentsInSlot("header");
getElement().findComponentSlot(component);
```

Convenience methods for named slots:

```java
public MyComp addToHeader(Component... components) {
  getElement().add(HEADER_SLOT, components);
  return this;
}
```

## Constructors

Always call `super()` with zero args. Chain convenience constructors via `this()`:

```java
public MyComp() { super(); }
public MyComp(String text) { this(); setText(text); }
```
