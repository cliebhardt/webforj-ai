# Event System

## Event Class

Every event is a **standalone class** in an `event/` sub-package, extending
`ComponentEvent<T>`:

```java
package com.example.event;

@EventName("x-show")
@EventOptions(
    filter = "event.target.isSameNode(component)",
    data = {
        @EventData(key = "detail", exp = "event.detail")
    }
)
public class ShowEvent extends ComponentEvent<MyDialog> {
  public ShowEvent(MyDialog component, Map<String, Object> payload) {
    super(component, payload);
  }
}
```

**Never** nest event classes as static inner classes — always standalone files.

## Annotations

### @EventName

Maps the class to a DOM event name:

```java
@EventName("x-change")
public class ChangeEvent extends ComponentEvent<MyInput> { }
```

### @EventOptions

- `filter` — a **JavaScript expression** evaluated in the browser that must
  return `true` for the event to fire. Prevents catching events bubbled from
  child elements:
  ```java
  @EventOptions(filter = "event.target.isSameNode(component)")
  ```
  Use when the event can bubble (most custom events do).

- `data` — extracts payload from the event. `key` is the Java-side map key,
  `exp` is a **JavaScript expression** evaluated in the browser (typically
  `event.detail.xxx`, `event.target.xxx`, or `component.xxx`):
  ```java
  @EventOptions(data = {
      @EventData(key = "value", exp = "event.detail.value"),
      @EventData(key = "index", exp = "event.detail.index")
  })
  ```

## Event Data Access

```java
// Via @EventData keys
public String getValue() {
  return (String) getData().get("value");
}

public int getIndex() {
  return ((Number) getData().get("index")).intValue();
}
```

## Dual Listener Pattern

Every event **must** have both registration methods on the component:

```java
// Primary — returns ListenerRegistration for removal
public ListenerRegistration<ShowEvent> addShowListener(
    EventListener<ShowEvent> listener) {
  return addEventListener(ShowEvent.class, listener);
}

// Convenience alias — delegates to primary
public ListenerRegistration<ShowEvent> onShow(
    EventListener<ShowEvent> listener) {
  return addShowListener(listener);
}
```

Both return `ListenerRegistration` so listeners can be removed.

## ElementEventOptions (Programmatic)

For inline event listeners (without a dedicated event class), use
`ElementEventOptions` to configure payload extraction, filtering,
debounce, and throttle:

```java
ElementEventOptions opts = new ElementEventOptions();
opts.addData("value", "event.target.value");
opts.setFilter("event.target.isSameNode(component)");

getElement().addEventListener("input", event -> {
  String value = (String) event.getData().get("value");
}, opts);
```

### Debounce and Throttle

Prevent server overload from rapid events (typing, scrolling, resizing):

```java
// Debounce — fires once after 300ms of inactivity
ElementEventOptions opts = new ElementEventOptions();
opts.addData("value", "event.target.value");
opts.setDebounce(300);
getElement().addEventListener("input", this::onInput, opts);

// Throttle — fires at most once every 200ms
ElementEventOptions scrollOpts = new ElementEventOptions();
scrollOpts.addData("scrollTop", "event.target.scrollTop");
scrollOpts.setThrottle(200);
getElement().addEventListener("scroll", this::onScroll, scrollOpts);
```

**When to use each:**
- `setDebounce(ms)` — search input, form validation, auto-save (wait for
  user to stop typing)
- `setThrottle(ms)` — scroll, mousemove, resize (limit frequency of updates)

## Common Third-Party Event Patterns

Ready-to-use `@EventOptions` templates for typical web component events:

**Value change** (input, select, slider):
```java
@EventOptions(
    filter = "event.target.isSameNode(component)",
    data = {@EventData(key = "value", exp = "event.detail.value")}
)
```

**Selection** (list, menu, tab):
```java
@EventOptions(
    filter = "event.target.isSameNode(component)",
    data = {
        @EventData(key = "value", exp = "event.detail.item.value"),
        @EventData(key = "index", exp = "event.detail.item.index")
    }
)
```

**Toggle** (switch, checkbox, accordion):
```java
@EventOptions(
    filter = "event.target.isSameNode(component)",
    data = {@EventData(key = "checked", exp = "event.detail.checked")}
)
```

**Validation** (form fields):
```java
@EventOptions(
    filter = "event.target.isSameNode(component)",
    data = {
        @EventData(key = "valid", exp = "event.detail.valid"),
        @EventData(key = "message", exp = "event.detail.message")
    }
)
```

**No detail payload** (show, hide, open, close):
```java
@EventOptions(filter = "event.target.isSameNode(component)")
```

## Internal Registration

`addEventListener(EventClass.class, listener)` is inherited from the base
component class. It wires up the DOM event listener using `@EventName` and
`@EventOptions` metadata from the event class.
