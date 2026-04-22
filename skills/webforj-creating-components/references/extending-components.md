# Beyond Existing Custom Element Libraries

Patterns for when the Custom Element you need **doesn't already exist**. For
wrapping libraries that already ship Custom Elements, see
[element-composite.md](element-composite.md) and the main SKILL.md workflow.

## Path B: Build a Custom Element, then wrap it

**This is the preferred approach** for any new visual component — whether
you're building something from scratch or wrapping a plain JS library.

### Step 1 — Write a vanilla Custom Element in JS

Create a `.js` file in `src/main/resources/static/libs/{component}/`.

**Template:**

```js
class MyWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    const tpl = document.createElement("template");
    tpl.innerHTML = `
      <style>
        :host { display: inline-block; }
        /* component styles here */
      </style>
      <!-- component markup here -->
    `;
    this.shadowRoot.appendChild(tpl.content.cloneNode(true));

    // Cache shadow DOM references
    // this._someEl = this.shadowRoot.querySelector(".some-el");

    // Internal state
    this._value = "";
  }

  // --- Properties (getter/setter pairs) ---

  get value() { return this._value; }
  set value(v) {
    if (v === this._value) return;
    this._value = v;
    // Update the DOM to reflect the new value
    // this._someEl.textContent = v;
  }

  // --- User interaction handler ---
  // Dispatch events only from user actions, never from property setters

  _onUserInput(v) {
    this._value = v;
    this.dispatchEvent(new CustomEvent("value-changed", {
      detail: { value: v },
      bubbles: true,
      composed: true
    }));
  }

  // --- Public methods ---

  // focus() { this._someEl.focus(); }
}

customElements.define("my-widget", MyWidget);
```

**Key rules for the JS side:**

- Extend `HTMLElement`, call `this.attachShadow({ mode: "open" })`.
- All styles go **inside Shadow DOM** — use `:host` for the host element and
  `var(--dwc-*)` tokens for webforJ theme integration.
- Expose state via **getter/setter pairs** (`get value()` / `set value(v)`).
  These become `PropertyDescriptor` targets in Java.
- Dispatch events **only from user interaction handlers**, never from property
  setters. Programmatic changes must not fire events.
- Always set `bubbles: true` and `composed: true` on dispatched events.
- Use a prefix for your tag name to avoid collisions (e.g. `app-`, `my-`).

**Wrapping a third-party JS library inside a CE:**

If you're wrapping a library like a chart engine or code editor, initialize it
inside `connectedCallback()`:

```js
class MyEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>:host { display: block; }</style>
      <div class="editor-root"></div>
    `;
    this._root = this.shadowRoot.querySelector(".editor-root");
  }

  connectedCallback() {
    // Initialize the third-party library here
    this._editor = new ThirdPartyEditor(this._root, { /* options */ });
  }

  disconnectedCallback() {
    // Clean up if the library requires it
    if (this._editor) this._editor.destroy();
  }

  get value() { return this._editor?.getValue() ?? ""; }
  set value(v) {
    if (this._editor) this._editor.setValue(v);
  }
}

customElements.define("my-editor", MyEditor);
```

### Step 2 — Load the JS file

Use `@JavaScript` on the Java wrapper class to load your Custom Element
definition. If the CE wraps a third-party library, load that library's JS/CSS
too:

```java
@JavaScript(value = "ws://libs/my-widget/my-widget.js",
    attributes = {@Attribute(name = "type", value = "module")})
@NodeName("my-widget")
public class MyWidget extends ElementComposite { ... }
```

### Step 3 — Write the Java wrapper

From here, the Java side is **identical** to wrapping any other existing CE
library. Use `@NodeName`, `PropertyDescriptor`, `@EventName`,
concern interfaces, and all the patterns described in SKILL.md and
[element-composite.md](element-composite.md).

### Complete example: Color Picker

**JS** (`src/main/resources/static/libs/color-picker/color-picker.js`):

```js
class AppColorPicker extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    // ... Shadow DOM template with color swatches ...
    this._value = "";
  }

  get value() { return this._value; }
  set value(v) {
    if (v !== this._value) { this._value = v; }
  }

  // Called from swatch click handler — user interaction only
  _onSwatchClick(v) {
    this._value = v;
    this.dispatchEvent(new CustomEvent("value-changed", {
      detail: { value: v }, bubbles: true, composed: true
    }));
  }
}

customElements.define("app-color-picker", AppColorPicker);
```

**Java** (`ColorPicker.java`):

```java
@JavaScript(value = "ws://libs/color-picker/color-picker.js",
    attributes = {@Attribute(name = "type", value = "module")})
@NodeName("app-color-picker")
public class ColorPicker extends ElementComposite
    implements HasClassName<ColorPicker>, HasValue<ColorPicker, Color> {

  private final PropertyDescriptor<String> valueProp =
      PropertyDescriptor.property("value", "");

  @Override
  public ColorPicker setValue(Color color) {
    String hex = String.format("#%02x%02x%02x",
        color.getRed(), color.getGreen(), color.getBlue());
    set(valueProp, hex);
    return this;
  }

  @Override
  public Color getValue() {
    String hex = get(valueProp, true, String.class);
    return hex != null ? Color.decode(hex) : null;
  }

  @Override
  public ListenerRegistration<ValueChangeEvent<Color>> addValueChangeListener(
      EventListener<ValueChangeEvent<Color>> listener) {
    // Bridge the JS "value-changed" event to Java
    // ...
  }
}
```

---

## Path C: Extend an HTML element (lightweight fallback)

Use **only** when writing a Custom Element would be overkill — e.g. a trivial
one-off integration that doesn't need Shadow DOM, property bridging, or reuse.

### Structure

```java
@JavaScript(value = "ws://libs/jsoneditor/jsoneditor.min.js",
    attributes = {@Attribute(name = "type", value = "module")})
@StyleSheet("ws://libs/jsoneditor/jsoneditor.min.css")
public class JsonEditor extends Div {

  private String value = "{}";

  @Override
  protected void onDidCreate() {
    getElement().executeJs(
        "new JSONEditor(component, { onChange: () => {} })");
    syncState();
  }

  public JsonEditor setValue(String json) {
    this.value = json;
    if (isAttached()) {
      getElement().executeJs(
          "component.__editor.set(JSON.parse('" + value + "'))");
    }
    return this;
  }

  private void syncState() {
    if (value != null) {
      getElement().executeJs(
          "component.__editor.set(JSON.parse('" + value + "'))");
    }
  }
}
```

### Key points

- **Base class** — Extend `Div`, `Span`, or whichever HTML element the library
  mounts into. Do not use `ElementComposite` (no custom tag exists).
- **Resource loading** — `@JavaScript` and `@StyleSheet` load the library.
  Use `@Attribute(name = "type", value = "module")` for ES modules.
  Place files in `src/main/resources/static/libs/{library}/`.
- **Initialization** — Override `onDidCreate()` to run JS that creates the widget.
  The `component` keyword in `executeJs` refers to the underlying DOM element.
- **State management** — Store state in Java fields. In setters, update the
  field and push to JS only if `isAttached()` is true. In `onDidCreate()`, call a
  `syncState()` method to push all accumulated state to the JS widget.
- **No PropertyDescriptor** — Since there is no web component property bridge,
  manage state with plain Java fields and manual JS synchronization.
- **Consider Path B instead** — If you find yourself writing complex state sync
  logic or needing style encapsulation, switch to writing a Custom Element.

---

## Path D: Page-Level Utility

Use when wrapping a browser API or page-level feature that has no visible DOM
widget (e.g. VirtualKeyboard API, Notification API, geolocation).

### Structure

```java
public class VirtualKeyboard {

  private static final String OBJECT_TABLE_KEY = "VirtualKeyboard.instance";
  private final EventDispatcher eventDispatcher = new EventDispatcher();
  private final Page page;
  private boolean initialized = false;

  private VirtualKeyboard() {
    this.page = Page.getCurrent();
    initialize();
  }

  public static VirtualKeyboard getCurrent() {
    if (!ObjectTable.contains(OBJECT_TABLE_KEY)) {
      ObjectTable.put(OBJECT_TABLE_KEY, new VirtualKeyboard());
    }
    return (VirtualKeyboard) ObjectTable.get(OBJECT_TABLE_KEY);
  }

  public ListenerRegistration<VirtualKeyboardEvent> addListener(
      EventListener<VirtualKeyboardEvent> listener) {
    return eventDispatcher.addListener(VirtualKeyboardEvent.class, listener);
  }

  private void initialize() {
    if (initialized) return;

    String js = """
      (function() {
        if ('virtualKeyboard' in navigator) {
          navigator.virtualKeyboard.overlaysContent = true;
          navigator.virtualKeyboard.addEventListener('geometrychange', (e) => {
            window.dispatchEvent(new CustomEvent('vk-change', {
              detail: { height: e.target.boundingRect.height }
            }));
          });
        }
      })();
    """;

    page.executeJsVoidAsync(js);

    PageEventOptions options = new PageEventOptions();
    options.addData("height", "event.detail.height");

    page.addEventListener("vk-change", event -> {
      Map<String, Object> data = event.getData();
      if (data != null) {
        double height = ((Number) data.get("height")).doubleValue();
        eventDispatcher.dispatchEvent(new VirtualKeyboardEvent(this, height));
      }
    }, options);

    initialized = true;
  }

  public static class VirtualKeyboardEvent extends EventObject {
    private final double height;

    public VirtualKeyboardEvent(Object source, double height) {
      super(source);
      this.height = height;
    }

    public boolean isOpen() { return height > 0; }
    public double getHeight() { return height; }
  }
}
```
