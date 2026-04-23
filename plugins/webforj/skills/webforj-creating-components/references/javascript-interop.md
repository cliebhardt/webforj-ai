# JavaScript Interop

## The `component` Keyword

In `executeJs` and related calls, `component` refers to the **client-side DOM
element** — not `this` in Java.

```java
getElement().executeJsAsync("component.show()");
// equivalent to: document.querySelector('my-tag').show()
```

## Six Execution Methods

All called on `getElement()`:

| Method | Returns | Waits for attach? | Use when |
|--------|---------|-------------------|----------|
| `executeJs(script)` | Object | No | Sync, immediate result needed |
| `executeJsAsync(script)` | PendingResult | Yes | Async with result |
| `executeJsVoidAsync(script)` | void | Yes | Fire-and-forget |
| `callJsFunction(name, args)` | Object | No | Sync function call |
| `callJsFunctionAsync(name, args)` | PendingResult | Yes | **Preferred** — async function call |
| `callJsFunctionVoidAsync(name, args)` | void | Yes | Fire-and-forget function call |

**Prefer async variants** — they wait for DOM attachment, which is safer.

## callJsFunction vs executeJs

`callJsFunction` calls a method on the component element directly:

```java
// Calls component.focus()
getElement().callJsFunctionAsync("focus");

// Calls component.scrollIntoView({behavior: 'smooth'})
getElement().callJsFunctionAsync("scrollIntoView",
    Map.of("behavior", "smooth"));
```

`executeJs` runs arbitrary script with `component` as a reference:

```java
// Complex logic
getElement().executeJsAsync(
    "component.updateComplete.then(() => component.requestUpdate())");
```

Component arguments in `callJsFunction` are auto-resolved to client-side references.

## Parameter Serialization

Arguments passed to `callJsFunction` / `callJsFunctionAsync` are serialized
automatically:

| Java type | Becomes in JS |
|---|---|
| `String`, `Boolean`, `Integer`, `Double` | Primitive |
| `Map<String, ?>` | Object literal |
| `List<?>`, arrays | Array |
| `Component` instance | Client-side element reference |
| Any other object | JSON-serialized via Gson |

```java
// Primitives
getElement().callJsFunctionAsync("setOpacity", 0.5);

// Map -> JS object
getElement().callJsFunctionAsync("scrollIntoView",
    Map.of("behavior", "smooth", "block", "nearest"));

// Component -> client-side element reference
getElement().callJsFunctionAsync("attachTo", otherComponent);
```

`executeJs` does **not** accept parameters — use `callJsFunction` variants
when you need to pass arguments. For `executeJs`, inline values into the
script string or use `component` to reference the element itself.

## Timing

### onDidCreate()

Override for post-attach setup — runs after the element is created in the DOM:

```java
@Override
protected void onDidCreate() {
  getElement().executeJsVoidAsync(
      "component.addEventListener('transitionend', () => { ... })");
}
```

### whenDefined()

Wait for the custom element to be registered in the browser:

```java
getElement().whenDefined().thenAccept(el -> {
  el.callJsFunctionVoidAsync("initialize");
});
```

## Page-Level JavaScript

For global setup (no component context):

```java
// Runs in window context — no component reference
Page.getCurrent().executeJsVoidAsync(
    "document.documentElement.classList.add('dark-mode')");
```

Dynamic script loading:

```java
Page.getCurrent().addJavaScript("https://cdn.example.com/lib.js", true,
    Map.of("type", "module"));
```

## Page Event Listening

Listen to browser-level events (not tied to a specific component):

```java
PageEventOptions opts = new PageEventOptions();
opts.addData("key", "event.key");
opts.addData("code", "event.code");

Page.getCurrent().addEventListener("keydown", event -> {
  String key = (String) event.getData().get("key");
  // handle key press
}, opts);
```

`PageEventOptions.addData(key, expression)` extracts values from the JS event
object into the Java event payload. The expression runs in the browser and must
return a JSON-serializable value.

Use this for global keyboard shortcuts, resize observers, online/offline
detection, or any event that belongs to `window` / `document` rather than a
specific component.

## Common Patterns

### Focus management
```java
public void focus() {
  getElement().callJsFunctionVoidAsync("focus");
}
```

### Calling component methods
```java
public PendingResult<Object> show() {
  return getElement().callJsFunctionAsync("show");
}

public void hide() {
  getElement().callJsFunctionVoidAsync("hide");
}
```

### Getting computed values
```java
public PendingResult<Object> getFormData() {
  return getElement().executeJsAsync(
      "return new FormData(component)");
}
```
